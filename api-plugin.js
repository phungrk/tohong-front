import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadEnv } from 'vite'

/* global process */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const AGENTS_DIR = path.join(ROOT, '.claude', 'agents')
const INPUT_DIR = path.join(ROOT, 'input')

async function buildSystemPrompt() {
  const [claudeMd, agentFiles] = await Promise.all([
    fs.readFile(path.join(ROOT, 'CLAUDE.md'), 'utf8'),
    fs.readdir(AGENTS_DIR),
  ])

  const agentContents = await Promise.all(
    agentFiles.map((f) => fs.readFile(path.join(AGENTS_DIR, f), 'utf8'))
  )

  let profile = 'Chưa có profile. Hãy hỏi thông tin cơ bản từ couple: tên, vùng miền, ngày cưới dự kiến, ngân sách, số khách, địa điểm.'
  try {
    profile = await fs.readFile(path.join(INPUT_DIR, 'couple-profile.md'), 'utf8')
  } catch {
    // Keep the default onboarding prompt when no profile exists yet.
  }

  const agentSection = agentContents
    .map((content, i) => `### ${agentFiles[i].replace('.md', '')}\n${content}`)
    .join('\n\n---\n\n')

  return `${claudeMd}

## CHI TIẾT CÁC SUBAGENT
${agentSection}

## COUPLE PROFILE HIỆN TẠI
${profile}

## LƯU Ý PHẢN HỒI
- Luôn dùng tiếng Việt
- Warm, gần gũi — không robotic
- Khi dùng subagent nào, đề cập tự nhiên trong câu trả lời (ví dụ: "Em hỏi team Ngân sách...")
- Trả lời như một tin nhắn tư vấn tự nhiên, không phải tài liệu Markdown
- Không dùng Markdown: không heading, không bullet/list marker, không đánh số đầu dòng, không bảng, không bold/italic, không code block
- Chia thành các đoạn ngắn; nếu cần nhắc nhiều option thì viết bằng câu văn tự nhiên trong đoạn văn, ngăn bằng dấu phẩy hoặc dấu chấm phẩy`
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

export function weddingApiPlugin() {
  let apiKey = ''

  return {
    name: 'wedding-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode || 'development', process.cwd(), '')
      apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''

      // POST /api/chat — SSE streaming chat
      server.middlewares.use('/api/chat', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const handle = async () => {
          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY chưa được set. Thêm vào file .env hoặc shell environment.' }))
            return
          }

          const { messages } = await readBody(req)
          const systemPrompt = await buildSystemPrompt()

          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

          const client = new Anthropic({ apiKey })

          const stream = client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: systemPrompt,
            messages,
          })

          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            }
          }

          res.write('data: [DONE]\n\n')
          res.end()
        }

        handle().catch((err) => {
          console.error('[wedding-api] chat error:', err.message)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })

      // GET /api/profile — check profile + POST to save
      server.middlewares.use('/api/profile', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          next()
          return
        }

        const handle = async () => {
          res.setHeader('Content-Type', 'application/json')

          if (req.method === 'GET') {
            try {
              const content = await fs.readFile(
                path.join(INPUT_DIR, 'couple-profile.md'),
                'utf8'
              )
              res.end(JSON.stringify({ exists: true, content }))
            } catch {
              res.end(JSON.stringify({ exists: false }))
            }
            return
          }

          // POST — save profile
          const { content } = await readBody(req)
          await fs.mkdir(INPUT_DIR, { recursive: true })
          await fs.writeFile(path.join(INPUT_DIR, 'couple-profile.md'), content, 'utf8')
          res.end(JSON.stringify({ success: true }))
        }

        handle().catch((err) => {
          console.error('[wedding-api] profile error:', err.message)
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        })
      })
    },
  }
}
