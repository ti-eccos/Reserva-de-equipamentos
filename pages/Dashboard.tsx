import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole, Reservation, Equipment, ReservationStatus, EquipmentType } from '../types';
import { getReservations, getEquipments, createReservation, updateReservationStatus, getAllUsers, updateUserRole, toggleBlockUser, addEquipment, deleteEquipment, updateUserRole as updateUserRoleDB } from '../services/db';
import { Calendar } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { LogOut, Sun, Moon, Plus, Users, LayoutDashboard, Calendar as CalIcon, Monitor } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

// --- Sub-Components Logic ---

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'equipments' | 'users'>('home');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [newResDate, setNewResDate] = useState<Date | null>(null);

  // Form States
  const [formEquipments, setFormEquipments] = useState<string[]>([]);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formPurpose, setFormPurpose] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const res = await getReservations();
    const eqs = await getEquipments();
    
    // Filter for normal users
    if (user?.role === UserRole.USER) {
      setReservations(res.filter(r => r.userId === user.uid));
    } else {
      setReservations(res);
      if (user?.role === UserRole.SUPERADMIN) {
        const usrs = await getAllUsers();
        setUsersList(usrs);
      }
    }
    setEquipments(eqs);
  };

  const handleCreateReservation = async () => {
    if (!user || !formStart || !formEnd || formEquipments.length === 0) {
      alert("Preencha todos os campos");
      return;
    }
    
    if(!window.confirm("Confirmar reserva?")) return;

    try {
      const startDateTime = `${format(newResDate || new Date(), 'yyyy-MM-dd')}T${formStart}`;
      const endDateTime = `${format(newResDate || new Date(), 'yyyy-MM-dd')}T${formEnd}`;

      const status = await createReservation({
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        equipmentIds: formEquipments,
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: formPurpose,
        status: ReservationStatus.PENDING,
        createdAt: new Date().toISOString()
      });

      alert(status === ReservationStatus.APPROVED 
        ? "Reserva APROVADA com sucesso!" 
        : "Reserva CONFLITANTE. Status: Rejeitada.");
      
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Erro ao criar reserva");
    }
  };

  const handleUpdateStatus = async (id: string, status: ReservationStatus) => {
    if(window.confirm(`Mudar status para ${status}?`)) {
      await updateReservationStatus(id, status);
      fetchData();
      setIsModalOpen(false);
    }
  };

  // --- Render Functions ---

  const renderHome = () => {
    const total = reservations.length;
    const approved = reservations.filter(r => r.status === ReservationStatus.APPROVED).length;
    const pending = reservations.filter(r => r.status === ReservationStatus.PENDING).length;

    const data = [
      { name: 'Aprovadas', value: approved, color: '#22c55e' },
      { name: 'Pendentes', value: pending, color: '#eab308' },
      { name: 'Rejeitadas', value: total - approved - pending, color: '#ef4444' },
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold dark:text-white">Bem-vindo, {user?.displayName}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm">Total Reservas</h3>
            <p className="text-3xl font-bold dark:text-white">{total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm">Aprovadas</h3>
            <p className="text-3xl font-bold dark:text-white">{approved}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm">Pendentes</h3>
            <p className="text-3xl font-bold dark:text-white">{pending}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-80">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Status das Reservas</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0047AB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderEquipments = () => {
    // Only Admin/Superadmin
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<EquipmentType>(EquipmentType.CHROMEBOOK);

    const handleAdd = async () => {
      await addEquipment({ name: newName, type: newType, isActive: true, description: '' });
      setNewName('');
      fetchData();
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold dark:text-white">Gerenciar Equipamentos</h2>
        <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded shadow">
          <input 
            className="border p-2 rounded flex-1 dark:bg-gray-700 dark:text-white" 
            placeholder="Nome do Equipamento"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <select 
            className="border p-2 rounded dark:bg-gray-700 dark:text-white"
            value={newType}
            onChange={e => setNewType(e.target.value as EquipmentType)}
          >
            <option value={EquipmentType.CHROMEBOOK}>Chromebook</option>
            <option value={EquipmentType.IPAD}>iPad</option>
          </select>
          <button onClick={handleAdd} className="bg-eccos-blue text-white px-4 py-2 rounded">Adicionar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipments.map(eq => (
            <div key={eq.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-bold dark:text-white">{eq.name}</p>
                <p className="text-sm text-gray-500 uppercase">{eq.type}</p>
              </div>
              <button 
                onClick={async () => {
                  if(window.confirm('Excluir este equipamento?')) {
                    await deleteEquipment(eq.id);
                    fetchData();
                  }
                }}
                className="text-red-500 hover:bg-red-50 p-2 rounded"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold dark:text-white">Gestão de Usuários</h2>
        <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b dark:border-gray-700">
              <tr>
                <th className="p-4 dark:text-white">Nome</th>
                <th className="p-4 dark:text-white">Email</th>
                <th className="p-4 dark:text-white">Função</th>
                <th className="p-4 dark:text-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.uid} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4 dark:text-gray-300">{u.displayName}</td>
                  <td className="p-4 dark:text-gray-300">{u.email}</td>
                  <td className="p-4">
                    <select 
                      value={u.role}
                      disabled={u.email === "tecnologia@colegioeccos.com.br"}
                      onChange={async (e) => {
                         if(window.confirm('Alterar função?')) {
                           await updateUserRoleDB(u.uid, e.target.value as UserRole);
                           fetchData();
                         }
                      }}
                      className="border rounded p-1 dark:bg-gray-600 dark:text-white"
                    >
                      <option value={UserRole.USER}>Usuário</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                      <option value={UserRole.SUPERADMIN}>Superadmin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    {u.email !== "tecnologia@colegioeccos.com.br" && (
                      <button 
                        onClick={async () => {
                          if(window.confirm('Bloquear/Desbloquear usuário?')) {
                            await toggleBlockUser(u.uid, u.isBlocked);
                            fetchData();
                          }
                        }}
                        className={`px-3 py-1 rounded text-white ${u.isBlocked ? 'bg-red-500' : 'bg-gray-500'}`}
                      >
                        {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-20 flex flex-col">
        <div className="p-6 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold text-eccos-blue">Eccos Reserva</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('home')} className={`flex items-center w-full p-3 rounded ${activeTab === 'home' ? 'bg-blue-50 text-eccos-blue dark:bg-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            <LayoutDashboard className="mr-3" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`flex items-center w-full p-3 rounded ${activeTab === 'calendar' ? 'bg-blue-50 text-eccos-blue dark:bg-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            <CalIcon className="mr-3" /> Calendário
          </button>
          
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN) && (
            <button onClick={() => setActiveTab('equipments')} className={`flex items-center w-full p-3 rounded ${activeTab === 'equipments' ? 'bg-blue-50 text-eccos-blue dark:bg-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
              <Monitor className="mr-3" /> Equipamentos
            </button>
          )}

          {user?.role === UserRole.SUPERADMIN && (
            <button onClick={() => setActiveTab('users')} className={`flex items-center w-full p-3 rounded ${activeTab === 'users' ? 'bg-blue-50 text-eccos-blue dark:bg-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
              <Users className="mr-3" /> Usuários
            </button>
          )}
        </nav>

        <div className="p-4 border-t dark:border-gray-700">
          <button onClick={toggleTheme} className="flex items-center w-full p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded mb-2">
            {theme === 'light' ? <Moon className="mr-3" /> : <Sun className="mr-3" />}
            {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          </button>
          <button onClick={logout} className="flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded">
            <LogOut className="mr-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'calendar' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Agenda de Reservas</h2>
            <Calendar 
              reservations={reservations} 
              onSelectEvent={(r) => { setSelectedRes(r); setIsModalOpen(true); }}
              onSelectSlot={(d) => { 
                setNewResDate(d); 
                setSelectedRes(null); 
                setFormStart('');
                setFormEnd('');
                setFormEquipments([]);
                setIsModalOpen(true); 
              }}
            />
          </div>
        )}
        {activeTab === 'equipments' && renderEquipments()}
        {activeTab === 'users' && renderUsers()}
      </main>

      {/* Reservation Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedRes ? "Detalhes da Reserva" : "Nova Reserva"}
      >
        {selectedRes ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="dark:text-gray-300"><strong>Usuário:</strong> {selectedRes.userName}</div>
              <div className="dark:text-gray-300"><strong>Status:</strong> <span className={`px-2 py-0.5 rounded text-white text-xs ${
                selectedRes.status === 'approved' ? 'bg-green-500' : 
                selectedRes.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>{selectedRes.status.toUpperCase()}</span></div>
              <div className="dark:text-gray-300"><strong>Data:</strong> {format(parseISO(selectedRes.startTime), 'dd/MM/yyyy')}</div>
              <div className="dark:text-gray-300"><strong>Horário:</strong> {format(parseISO(selectedRes.startTime), 'HH:mm')} - {format(parseISO(selectedRes.endTime), 'HH:mm')}</div>
            </div>
            
            <div>
               <h4 className="font-bold mb-2 dark:text-white">Equipamentos:</h4>
               <ul className="list-disc pl-5 dark:text-gray-300">
                 {selectedRes.equipmentIds.map(id => {
                    const eq = equipments.find(e => e.id === id);
                    return <li key={id}>{eq?.name || id}</li>
                 })}
               </ul>
            </div>
            
            <div className="dark:text-gray-300"><strong>Motivo:</strong> {selectedRes.purpose}</div>

            {/* User can cancel own */}
            {user?.role === UserRole.USER && selectedRes.userId === user.uid && selectedRes.status !== ReservationStatus.CANCELLED && (
              <button 
                onClick={() => handleUpdateStatus(selectedRes.id, ReservationStatus.CANCELLED)}
                className="w-full bg-red-500 text-white p-2 rounded mt-4"
              >
                Cancelar Reserva
              </button>
            )}

            {/* Admin can approve/reject */}
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN) && (
              <div className="flex gap-2 mt-4">
                 <button onClick={() => handleUpdateStatus(selectedRes.id, ReservationStatus.APPROVED)} className="flex-1 bg-green-600 text-white p-2 rounded">Aprovar</button>
                 <button onClick={() => handleUpdateStatus(selectedRes.id, ReservationStatus.REJECTED)} className="flex-1 bg-red-600 text-white p-2 rounded">Rejeitar</button>
                 <button onClick={() => handleUpdateStatus(selectedRes.id, ReservationStatus.CANCELLED)} className="flex-1 bg-gray-600 text-white p-2 rounded">Cancelar</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-bold text-lg dark:text-white">
              Data: {newResDate && format(newResDate, 'dd/MM/yyyy')}
            </p>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Início</label>
                  <select 
                    className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                    value={formStart}
                    onChange={e => setFormStart(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {[...Array(14)].map((_, i) => {
                      const h = i + 7;
                      return <option key={h} value={`${h}:00:00`}>{h}:00</option>;
                    })}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Fim</label>
                  <select 
                    className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                    value={formEnd}
                    onChange={e => setFormEnd(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {[...Array(14)].map((_, i) => {
                      const h = i + 7;
                      return <option key={h} value={`${h}:59:59`}>{h}:59</option>;
                    })}
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-2">Equipamentos</label>
              <div className="max-h-40 overflow-y-auto border p-2 rounded dark:bg-gray-700 dark:border-gray-600">
                {equipments.map(eq => (
                  <label key={eq.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formEquipments.includes(eq.id)}
                      onChange={(e) => {
                        if(e.target.checked) setFormEquipments([...formEquipments, eq.id]);
                        else setFormEquipments(formEquipments.filter(id => id !== eq.id));
                      }}
                    />
                    <span className="dark:text-gray-200 text-sm">{eq.name} ({eq.type})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium dark:text-gray-300">Motivo</label>
               <input 
                 className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white" 
                 value={formPurpose}
                 onChange={e => setFormPurpose(e.target.value)}
                 placeholder="Ex: Aula de Geografia"
               />
            </div>

            <button onClick={handleCreateReservation} className="w-full bg-eccos-blue text-white font-bold p-3 rounded hover:bg-blue-800">
              Confirmar Reserva
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
