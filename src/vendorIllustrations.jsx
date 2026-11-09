// Ảnh minh hoạ tự vẽ khi ảnh vendor hỏng hoặc thiếu (spec T-066, việc T-068). Không dùng ảnh bên thứ ba.
// Mỗi hạng mục một hình nét viền; màu chỉ lấy từ token của app qua `style` (không viết cứng màu, không url mạng).
// Một hình nhẹ hơn 4096 byte. Cặp nền/nét: huy hiệu nền --paper, nét --ink-700.
import { VENDOR_CATEGORIES } from './screens/VendorCtx.jsx';

const ACCENT = { fill: 'var(--son-500)', stroke: 'none' };
const A = (p) => <circle {...p} style={ACCENT} />;

// Bông hoa năm cánh tròn quanh một nhuỵ
const flower = (cx, cy, pr, R) => (<>
  {[0, 1, 2, 3, 4].map((i) => {
    const a = (i * 72 - 90) * Math.PI / 180;
    return <circle key={i} cx={+(cx + R * Math.cos(a)).toFixed(1)} cy={+(cy + R * Math.sin(a)).toFixed(1)} r={pr} />;
  })}
  {A({ cx, cy, r: pr * 0.6 })}
</>);

const DRAW = {
  // Tiệc & nhà hàng: ly rượu
  venue: (<>
    <path d="M35 26H65C65 42 59 54 50 54C41 54 35 42 35 26Z" />
    <path d="M36 38H64M50 54V71M38 72H62M72 24V32M68 28H76" />
  </>),
  // Ăn hỏi & sính lễ: tráp tròn có nắp
  ceremony: (<>
    <path d="M24 50C24 34 76 34 76 50Z" />
    <path d="M26 50V68C26 75 74 75 74 68V50M26 60H74M50 34V30" />
    <circle cx="50" cy="27" r="3.5" />
    {A({ cx: 50, cy: 60, r: 2.5 })}
  </>),
  // Chụp ảnh / quay: máy ảnh
  photography: (<>
    <rect x="22" y="38" width="56" height="34" rx="5" />
    <path d="M36 38L40 30H60L64 38M68 45H72" />
    <circle cx="50" cy="55" r="11" />
    {A({ cx: 50, cy: 55, r: 4 })}
  </>),
  // Nhẫn cưới & trang sức: nhẫn kim cương
  jewelry: (<>
    <circle cx="50" cy="63" r="15" />
    <path d="M42 40L46 32H54L58 40L50 49ZM42 40H58M50 20V25M37 25L40 28M63 25L60 28" />
  </>),
  // Trang phục: váy cưới
  attire: (<>
    <path d="M43 22L41 42L28 78H72L59 42L57 22" />
    <path d="M43 22Q50 32 57 22M41 42H59M50 46V78" />
  </>),
  // Trang trí & hoa: bó hoa nhiều cánh
  decor: (<>
    {flower(50, 33, 5.5, 8)}{flower(30, 50, 4, 5.5)}{flower(70, 50, 4, 5.5)}
    <path d="M50 44V68M30 56L47 70M70 56L53 70M42 70H58L60 80H40Z" />
  </>),
  // Trang điểm & làm tóc: thỏi son
  makeup: (<>
    <rect x="38" y="60" width="24" height="20" rx="2" />
    <rect x="41" y="48" width="18" height="12" rx="1" />
    <path d="M43 48V36L57 28V48M38 60H62" />
    {A({ cx: 70, cy: 32, r: 2 })}{A({ cx: 74, cy: 40, r: 1.5 })}
  </>),
  // Xe hoa & đưa đón: xe có trái tim
  transport: (<>
    <path d="M18 64V55L30 51L38 40H62L70 51L82 55V64Z" />
    <path d="M50 40V51M30 51H70" />
    <circle cx="33" cy="66" r="7" style={{ fill: 'var(--paper)' }} />
    <circle cx="67" cy="66" r="7" style={{ fill: 'var(--paper)' }} />
    {A({ cx: 33, cy: 66, r: 2 })}{A({ cx: 67, cy: 66, r: 2 })}
    <path d="M44 26C44 22 50 22 50 27C50 22 56 22 56 26C56 30 50 33 50 33C50 33 44 30 44 26Z" />
  </>),
  // Thiệp & quà tặng: phong bì và tấm thiệp
  stationery: (<>
    <rect x="22" y="42" width="56" height="34" rx="3" />
    <path d="M22 44L50 64L78 44M32 42V26H68V42" />
    <path d="M50 38C46 35 44 33 46 31C48 29 50 31 50 32C50 31 52 29 54 31C56 33 54 35 50 38Z" />
  </>),
  // Tuần trăng mật: cây dừa bên biển
  honeymoon: (<>
    <path d="M50 78C48 66 50 52 56 40" />
    <path d="M56 40C50 30 38 30 30 38M56 40C54 28 64 22 74 26M56 40C66 34 76 40 78 48M56 40C46 38 40 42 38 52" />
    {A({ cx: 55, cy: 45, r: 2.6 })}{A({ cx: 60, cy: 44, r: 2.6 })}
    <path d="M30 78H72" />
    <circle cx="28" cy="28" r="6" />
  </>),
};

// Hạng mục lạ hoặc không xác định: đôi trái tim
const GENERIC = (<>
  <path d="M40 66C24 54 22 40 31 35C36 32 40 36 40 39C40 36 44 32 49 35C58 40 56 54 40 66Z" />
  <path d="M60 72C44 60 42 46 51 41C56 38 60 42 60 45C60 42 64 38 69 41C78 46 76 60 60 72Z" style={{ stroke: 'var(--son-500)' }} />
</>);

const illustrationLabel = (catId) => {
  const name = VENDOR_CATEGORIES.find((c) => c.id === catId)?.name;
  return name && Object.hasOwn(DRAW, catId) ? `Ảnh minh hoạ: ${name}` : 'Ảnh minh hoạ';
};

/* Phủ kín khung ảnh cha (cha phải có position relative). Không in chữ nhìn thấy (T-114); tên truy cập nằm ở aria-label.
   large: ô từ 80px trở lên, không title và cho chuột xuyên qua; ô nhỏ có title. */
export function VendorIllustration({ catId, large = false }) {
  const label = illustrationLabel(catId);
  return (
    <span role="img" aria-label={label} title={large ? undefined : label}
      style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: large ? 'none' : 'auto' }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" focusable="false"
        style={{ display: 'block', fill: 'none', stroke: 'var(--ink-700)', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <circle cx="50" cy="50" r="44" style={{ fill: 'var(--paper)', stroke: 'none' }} />
        {Object.hasOwn(DRAW, catId) ? DRAW[catId] : GENERIC}
      </svg>
    </span>
  );
}
