
import '/src/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VendorProvider } from '/src/screens/VendorCtx.jsx';
import { ScreenBudget } from '/src/screens/Budget.jsx';
import { api } from '/src/api.js';
import { ChatActionsCtx, VMatchChatCard } from '/src/screens/chat/VendorChatCards.jsx';
window.__t171api = api;
function App() {
  const [tab, setTab] = React.useState('chat');
  const [cards, setCards] = React.useState([{ k: 0, C: VMatchChatCard, p: { catId: 'venue' } }]);
  const push = (C, p) => setCards((c) => [...c, { k: c.length, C, p }]);
  return <VendorProvider coupleId="t171"><ChatActionsCtx.Provider value={{ pushUser: () => {}, pushAI: push }}>
    <button id="go-chat" onClick={() => setTab('chat')}>go-chat</button><button id="go-budget" onClick={() => setTab('budget')}>go-budget</button>
    <div id="chatPane" style={{ width: 360, display: tab === 'chat' ? 'block' : 'none' }}>{cards.map((c) => <div key={c.k} data-card={c.k}><c.C {...c.p} /></div>)}</div>
    <div id="budgetPane" style={{ width: 360, display: tab === 'budget' ? 'block' : 'none' }}>
      <ScreenBudget me={{ status: 'ok', retry: () => {} }} coupleId="t171" openCatId="venue" onOpenCat={() => {}} onCatMissing={() => {}} onOpenVendorChat={() => {}} onMenuOpen={() => {}} onOpenAI={() => {}} />
    </div>
  </ChatActionsCtx.Provider></VendorProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
