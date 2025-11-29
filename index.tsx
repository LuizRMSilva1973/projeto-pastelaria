import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- DADOS ESTÁTICOS & CONFIGURAÇÃO ---
const FLAVORS = [
  "CARNE", "QUEIJO", "PIZZA", "BAURU", "FRANGO", "FRANGO C/ CATUPIRY",
  "PALMITO", "CALABRESA C/ QUEIJO", "CARNE C/ QUEIJO", "CARNE C/ OVO",
  "FRANGO C/ QUEIJO", "TRÊS QUEIJO", "PORTUGUESA", "CALABRESA C/ CATUPIRY",
  "CAIPIRA", "CARNE C/ CHEDDAR", "CAMARÃO", "BACALHAU", "CARNE MALUCA C/ QUEIJO",
  "CARNE SECA C/ QUEIJO", "NORDESTINO", "BRÓCOLIS", "ALHO PORÓ", "À MODA",
  "CAMARÃO C/ CATUPIRY", "COSTELA GAÚCHA", "QUEIJO C/ BACON", "COSTELA MELT",
  "BRASILEIRO", "ESPECIAL DE CARNE", "MINI ESPECIAL DE CARNE",
  "ESPECIAL DE FRANGO", "CHOCOLATE", "CREME DE AVELÃ", "NUTELLA"
];

const MACHINES = [
  { id: 1, name: "Máquina 01 (Principal)", slug: "m1" },
  { id: 2, name: "Máquina 02 (Auxiliar)", slug: "m2" },
  { id: 3, name: "Máquina 03 (Especiais)", slug: "m3" }
];

// --- TIPOS ---
type Task = {
  id: number;
  flavor: string;
  quantity: number;
  machineId: number;
  status: 'PENDING' | 'DONE';
  origin: string;
  client: string;
  productionDate: string; // ISO String
  createdAt: number;
};

// --- COMPONENTES ---

// 4. CHATBOT IA
const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Olá! Sou o assistente virtual da pastelaria. Posso ajudar com dúvidas sobre sabores, máquinas ou gestão. O que você precisa?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Contexto do sistema para a IA
      const systemInstruction = `
        Você é um assistente especialista no "Pastelaria Production System".
        
        Dados do Sistema:
        - Sabores disponíveis (${FLAVORS.length}): ${FLAVORS.join(', ')}.
        - Máquinas: ${MACHINES.map(m => m.name).join(', ')}.
        
        Suas funções:
        1. Ajudar o operador a encontrar sabores ou tirar dúvidas.
        2. Explicar como funciona o sistema (distribuição automática, regra das 8h).
        3. Responder de forma curta, amigável e em português do Brasil.
        
        Se perguntarem sobre algo fora do contexto de pastelaria ou do sistema, traga gentilmente o assunto de volta.
      `;

      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: userText });
      const responseText = result.text;

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl z-50 transition-transform hover:scale-110 flex items-center justify-center"
        title="Chat IA"
      >
        <span className="material-icons text-3xl">{isOpen ? 'close' : 'smart_toy'}</span>
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] h-[500px] max-h-[70vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700 fade-in overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex items-center gap-2">
            <span className="material-icons">smart_toy</span>
            <h3 className="font-bold text-lg">Assistente Pastelaria</h3>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none animate-pulse text-gray-500 text-sm">
                  Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida..."
              className="flex-1 border dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 transition-colors"
            >
              <span className="material-icons text-sm transform rotate-[-45deg] relative left-[2px]">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// 1. TELA DA TV (CHÃO DE FÁBRICA)
const TVScreen = ({ machine, tasks, onCompleteTask, onBack }: any) => {
  const myTasks = tasks.filter((t: Task) => t.machineId === machine.id && t.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div>
          <button onClick={onBack} className="text-gray-400 hover:text-white mb-2 flex items-center gap-1 text-sm">
            <span className="material-icons text-sm">arrow_back</span> Voltar
          </button>
          <h1 className="text-4xl font-bold text-yellow-400 uppercase tracking-wider">{machine.name}</h1>
        </div>
        <div className="text-right">
          <div className="text-6xl font-bold">{myTasks.length}</div>
          <div className="text-gray-400 uppercase text-sm">Tarefas Pendentes</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {myTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <span className="material-icons text-9xl">task_alt</span>
            <p className="text-3xl mt-4">Tudo limpo por aqui!</p>
            <p className="text-xl">Aguardando novos pedidos...</p>
          </div>
        ) : (
          myTasks.map((task: Task) => (
            <div key={task.id} className="bg-gray-800 rounded-xl p-6 flex justify-between items-center border-l-8 border-blue-500 shadow-lg">
              <div>
                <h2 className="text-5xl font-bold mb-2">{task.flavor}</h2>
                <div className="flex gap-4 text-gray-400 text-lg">
                  <span className="flex items-center gap-1"><span className="material-icons text-sm">person</span> {task.client}</span>
                  <span className="flex items-center gap-1"><span className="material-icons text-sm">event</span> {new Date(task.productionDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="block text-6xl font-bold">{task.quantity}</span>
                  <span className="text-sm text-gray-400">UNIDADES</span>
                </div>
                <button
                  onClick={() => onCompleteTask(task.id)}
                  className="bg-green-600 hover:bg-green-500 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  <span className="material-icons text-5xl">check</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 2. TELA DO OPERADOR (PEDIDO MANUAL)
const OperatorScreen = ({ onSubmit, onBack }: any) => {
  const [client, setClient] = useState('');
  const [cart, setCart] = useState<{flavor: string, qty: number}[]>([]);
  const [selFlavor, setSelFlavor] = useState('');
  const [selQty, setSelQty] = useState(10);

  const add = () => {
    if (!selFlavor) return;
    setCart([...cart, { flavor: selFlavor, qty: selQty }]);
  };

  const submit = () => {
    if (!client || cart.length === 0) return alert('Preencha os dados!');
    onSubmit({ client, items: cart });
    setClient('');
    setCart([]);
    alert('Pedido enviado para produção!');
  };

  return (
    <div className="min-h-screen p-6 fade-in bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
        <span className="material-icons">arrow_back</span> Voltar ao Menu
      </button>
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 transition-colors duration-300">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <span className="material-icons">add_shopping_cart</span>
          Novo Pedido (Manual)
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome do Cliente</label>
          <input
            className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 outline-none transition-colors bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ex: João da Silva (Reserva)"
            value={client}
            onChange={e => setClient(e.target.value)}
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">Adicionar Itens</h3>
          <div className="flex gap-3">
            <select
              className="flex-1 border p-3 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selFlavor}
              onChange={e => setSelFlavor(e.target.value)}
            >
              <option value="">Selecione o Sabor...</option>
              {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input
              type="number"
              className="w-24 border p-3 rounded-lg text-center bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selQty}
              onChange={e => setSelQty(Number(e.target.value))}
              min="1"
            />
            <button
              onClick={add}
              className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              ADD
            </button>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Resumo do Pedido</h3>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {cart.map((item, idx) => (
                <li key={idx} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.flavor}</span>
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-bold">{item.qty} un</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={submit}
          disabled={cart.length === 0}
          className="w-full bg-green-600 text-white py-4 rounded-lg text-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Confirmar Produção
        </button>
      </div>
    </div>
  );
};

// 3. DASHBOARD ADMINISTRATIVO
const AdminDashboard = ({ tasks, onSimulateCRM, onNavigate, darkMode, toggleTheme }: any) => {
  const pending = tasks.filter((t: Task) => t.status === 'PENDING').length;
  const done = tasks.filter((t: Task) => t.status === 'DONE').length;

  // Agrupamento por sabor (Relatório Simplificado)
  const report = tasks.reduce((acc: any, t: Task) => {
    acc[t.flavor] = (acc[t.flavor] || 0) + t.quantity;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 fade-in transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Painel de Controle</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestão de Produção de Pastéis</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-lg shadow-sm hover:opacity-80 transition-colors"
            title="Alternar Tema"
          >
            <span className="material-icons">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button
            onClick={() => onNavigate('operator')}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2"
          >
            <span className="material-icons text-sm">add</span> Pedido Manual
          </button>
          <button
            onClick={onSimulateCRM}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 font-medium flex items-center gap-2"
          >
            <span className="material-icons text-sm">cloud_download</span> Simular CRM
          </button>
        </div>
      </header>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-yellow-400 transition-colors">
          <span className="text-gray-400 text-sm font-bold uppercase">Fila de Produção</span>
          <div className="text-5xl font-bold text-gray-800 dark:text-white mt-2">{pending} <span className="text-lg text-gray-400 font-normal">itens</span></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500 transition-colors">
          <span className="text-gray-400 text-sm font-bold uppercase">Produzidos Hoje</span>
          <div className="text-5xl font-bold text-gray-800 dark:text-white mt-2">{done} <span className="text-lg text-gray-400 font-normal">itens</span></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500 transition-colors">
          <span className="text-gray-400 text-sm font-bold uppercase">Total Geral</span>
          <div className="text-5xl font-bold text-gray-800 dark:text-white mt-2">{pending + done} <span className="text-lg text-gray-400 font-normal">itens</span></div>
        </div>
      </div>

      {/* LINK PARA TVS */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Monitoramento de Máquinas (TVs)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MACHINES.map(m => {
            const load = tasks.filter((t: Task) => t.machineId === m.id && t.status === 'PENDING').reduce((acc: number, t: Task) => acc + t.quantity, 0);
            return (
              <button
                key={m.id}
                onClick={() => onNavigate(`tv-${m.id}`)}
                className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-left p-6 rounded-xl shadow-lg group transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-lg">{m.name}</span>
                  <span className="material-icons text-gray-500 group-hover:text-white">tv</span>
                </div>
                <div className="text-gray-400 text-sm">Carga atual: <span className="text-white font-bold">{load} pastéis</span></div>
              </button>
            )
          })}
        </div>
      </div>

      {/* RELATÓRIO DE SABORES */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="font-bold text-gray-700 dark:text-gray-200">Relatório de Produção (Total)</h2>
        </div>
        <div className="p-6">
          {Object.keys(report).length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nenhum dado registrado ainda.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report).map(([flavor, qtd]: any) => (
                <div key={flavor} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate mr-2" title={flavor}>{flavor}</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{qtd}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
const App = () => {
  const [view, setView] = useState('admin'); // admin, operator, tv-1, tv-2, tv-3
  const [tasks, setTasks] = useState<Task[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Toggle Dark Mode
  const toggleTheme = () => setDarkMode(!darkMode);

  // Regra das 8h (Simulada)
  const calculateProductionDate = () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(8, 0, 0, 0);
    if (now > cutoff) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }
    return now.toISOString();
  };

  // Lógica de Distribuição de Carga
  const distribute = (items: {flavor: string, qty: number}[], clientName: string, origin: string) => {
    const newTasks: Task[] = [];
    const prodDate = calculateProductionDate();

    items.forEach(item => {
      // Encontrar máquina com menos carga PENDENTE
      const machineLoad = MACHINES.map(m => ({
        id: m.id,
        load: tasks.filter(t => t.machineId === m.id && t.status === 'PENDING').reduce((acc, t) => acc + t.quantity, 0)
          // Adiciona a carga dos itens que JÁ estamos processando neste loop para balancear melhor
          + newTasks.filter(nt => nt.machineId === m.id).reduce((acc, nt) => acc + nt.quantity, 0)
      }));

      // Sort by load asc
      machineLoad.sort((a, b) => a.load - b.load);
      const targetMachineId = machineLoad[0].id;

      newTasks.push({
        id: Date.now() + Math.random(),
        flavor: item.flavor,
        quantity: item.qty,
        machineId: targetMachineId,
        status: 'PENDING',
        origin,
        client: clientName,
        productionDate: prodDate,
        createdAt: Date.now()
      });
    });

    setTasks(prev => [...prev, ...newTasks]);
  };

  // Handlers
  const handleCRMImport = () => {
    const randomClient = `Cliente Web #${Math.floor(Math.random() * 1000)}`;
    const randomItems = [
      { flavor: FLAVORS[Math.floor(Math.random() * FLAVORS.length)], qty: 10 + Math.floor(Math.random() * 40) },
      { flavor: FLAVORS[Math.floor(Math.random() * FLAVORS.length)], qty: 5 + Math.floor(Math.random() * 20) }
    ];
    distribute(randomItems, randomClient, 'RD_STATION');
    alert(`Pedido simulado do CRM importado para ${randomClient}!`);
  };

  const handleManualOrder = (data: {client: string, items: {flavor: string, qty: number}[]}) => {
    distribute(data.items, data.client, 'MANUAL');
  };

  const handleCompleteTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'DONE' } : t));
  };

  // Render Content
  const renderContent = () => {
    if (view.startsWith('tv-')) {
      const machineId = parseInt(view.split('-')[1]);
      const machine = MACHINES.find(m => m.id === machineId);
      // TV Screen geralmente mantém o visual escuro de fábrica, mas você pode adaptar se quiser.
      return <TVScreen machine={machine} tasks={tasks} onCompleteTask={handleCompleteTask} onBack={() => setView('admin')} />;
    }

    if (view === 'operator') {
      return <OperatorScreen onSubmit={handleManualOrder} onBack={() => setView('admin')} />;
    }

    return <AdminDashboard tasks={tasks} onSimulateCRM={handleCRMImport} onNavigate={setView} darkMode={darkMode} toggleTheme={toggleTheme} />;
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300 relative">
        {renderContent()}
        <ChatBot />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);