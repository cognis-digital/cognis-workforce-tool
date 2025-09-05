import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  notifications: Notification[];
  activeModal: string | null;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  activeModal: string | null;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface AppData {
  agents: any[];
  knowledgeBases: any[];
  leads: any[];
  interactions: any[];
  tasks: any[];
  tokenUsage: any[];
  userDownloads: any[];
  dynamicTexts: Record<string, string>;
  lastSyncTimestamp: number;
  offlineQueue: any[];
}

interface AppState extends UIState, AppData {
  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setActiveModal: (modal: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Data Actions
  setAgents: (agents: any[]) => void;
  addAgent: (agent: any) => void;
  updateAgent: (id: string, updates: any) => void;
  removeAgent: (id: string) => void;
  
  setKnowledgeBases: (kbs: any[]) => void;
  addKnowledgeBase: (kb: any) => void;
  updateKnowledgeBase: (id: string, updates: any) => void;
  removeKnowledgeBase: (id: string) => void;
  
  setLeads: (leads: any[]) => void;
  addLead: (lead: any) => void;
  updateLead: (id: string, updates: any) => void;
  removeLead: (id: string) => void;
  
  addInteraction: (interaction: any) => void;
  
  // Task Actions
  setTasks: (tasks: any[]) => void;
  addTask: (task: any) => void;
  updateTask: (id: string, updates: any) => void;
  removeTask: (id: string) => void;
  
  // Token Usage Actions
  setTokenUsage: (usage: any[]) => void;
  addTokenUsage: (usage: any) => void;
  
  // Download Actions
  setUserDownloads: (downloads: any[]) => void;
  addUserDownload: (download: any) => void;
  
  // Dynamic Text Management
  updateDynamicText: (key: string, value: string) => void;
  getDynamicText: (key: string, defaultValue: string) => string;
  
  // Sync Actions
  syncData: () => Promise<void>;
  addToOfflineQueue: (action: any) => void;
  processOfflineQueue: () => Promise<void>;
  setLastSyncTimestamp: (timestamp: number) => void;
  
  // Utility Actions
  reset: () => void;
}

const initialState: UIState & AppData = {
  // UI State
  sidebarOpen: false,
  theme: 'dark',
  notifications: [],
  activeModal: null,
  searchQuery: '',
  viewMode: 'grid',
  
  // App Data
  agents: [],
  knowledgeBases: [],
  leads: [],
  interactions: [],
  tasks: [],
  tokenUsage: [],
  userDownloads: [],
  dynamicTexts: {},
  lastSyncTimestamp: 0,
  offlineQueue: []
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // UI Actions
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
        toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
        setTheme: (theme: 'dark' | 'light') => set({ theme }),
        
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false
          };
          
          set(state => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep only last 50
          }));
        },
        
        markNotificationRead: (id: string) => {
          set(state => ({
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, read: true } : n
            )
          }));
        },
        
        clearNotifications: () => set({ notifications: [] }),
        setActiveModal: (modal: string | null) => set({ activeModal: modal }),
        setSearchQuery: (query: string) => set({ searchQuery: query }),
        setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),

        // Data Actions
        setAgents: (agents: any[]) => set({ agents }),
        addAgent: (agent: any) => {
          set(state => ({ agents: [...state.agents, agent] }));
          get().addNotification({
            type: 'success',
            title: 'Agent Created',
            message: `${agent.name} has been successfully created.`
          });
        },
        updateAgent: (id: string, updates: any) => {
          set(state => ({
            agents: state.agents.map(agent => 
              agent.id === id ? { ...agent, ...updates, updated_at: new Date().toISOString() } : agent
            )
          }));
        },
        removeAgent: (id: string) => {
          const agent = get().agents.find(a => a.id === id);
          set(state => ({ agents: state.agents.filter(a => a.id !== id) }));
          if (agent) {
            get().addNotification({
              type: 'info',
              title: 'Agent Removed',
              message: `${agent.name} has been removed.`
            });
          }
        },

        setKnowledgeBases: (kbs: any[]) => set({ knowledgeBases: kbs }),
        addKnowledgeBase: (kb: any) => {
          set(state => ({ knowledgeBases: [...state.knowledgeBases, kb] }));
          get().addNotification({
            type: 'success',
            title: 'Knowledge Base Created',
            message: `${kb.name} has been successfully created.`
          });
        },
        updateKnowledgeBase: (id: string, updates: any) => {
          set(state => ({
            knowledgeBases: state.knowledgeBases.map(kb => 
              kb.id === id ? { ...kb, ...updates, updated_at: new Date().toISOString() } : kb
            )
          }));
        },
        removeKnowledgeBase: (id: string) => {
          const kb = get().knowledgeBases.find(k => k.id === id);
          set(state => ({ knowledgeBases: state.knowledgeBases.filter(k => k.id !== id) }));
          if (kb) {
            get().addNotification({
              type: 'info',
              title: 'Knowledge Base Removed',
              message: `${kb.name} has been removed.`
            });
          }
        },

        setLeads: (leads: any[]) => set({ leads }),
        addLead: (lead: any) => {
          set(state => ({ leads: [...state.leads, lead] }));
          get().addNotification({
            type: 'success',
            title: 'Lead Generated',
            message: `New lead: ${lead.company} (Score: ${lead.score}) has been added to your pipeline.`
          });
        },
        updateLead: (id: string, updates: any) => {
          set(state => ({
            leads: state.leads.map(lead => 
              lead.id === id ? { ...lead, ...updates, updated_at: new Date().toISOString() } : lead
            )
          }));
        },
        removeLead: (id: string) => {
          set(state => ({ leads: state.leads.filter(l => l.id !== id) }));
        },

        addInteraction: (interaction: any) => {
          set(state => ({ 
            interactions: [interaction, ...state.interactions].slice(0, 1000) // Keep last 1000
          }));
        },

        // Task Actions
        setTasks: (tasks: any[]) => set({ tasks }),
        addTask: (task: any) => {
          set(state => ({ tasks: [...state.tasks, task] }));
          get().addNotification({
            type: 'info',
            title: 'Task Created',
            message: `${task.title} has been assigned to ${task.agentName}.`
          });
        },
        updateTask: (id: string, updates: any) => {
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
            )
          }));
        },
        removeTask: (id: string) => {
          set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
        },

        // Token Usage Actions
        setTokenUsage: (usage: any[]) => set({ tokenUsage: usage }),
        addTokenUsage: (usage: any) => {
          set(state => ({ tokenUsage: [...state.tokenUsage, usage] }));
        },

        // Download Actions
        setUserDownloads: (downloads: any[]) => set({ userDownloads: downloads }),
        addUserDownload: (download: any) => {
          set(state => ({ userDownloads: [...state.userDownloads, download] }));
        },
        
        // Dynamic Text Management
        updateDynamicText: (key: string, value: string) => {
          set(state => ({
            dynamicTexts: { ...state.dynamicTexts, [key]: value }
          }));
        },
        
        getDynamicText: (key: string, defaultValue: string) => {
          const { dynamicTexts } = get();
          return dynamicTexts[key] || defaultValue;
        },

        // Sync Actions
        syncData: async () => {
          try {
            // Simulate data sync with server
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // In a real implementation, this would fetch fresh data from the server
            // and merge it with local state, handling conflicts appropriately
            
            set({ lastSyncTimestamp: Date.now() });
            
            get().addNotification({
              type: 'success',
              title: 'Data Synced',
              message: 'All data has been synchronized successfully.'
            });
          } catch (error: any) {
            get().addNotification({
              type: 'error',
              title: 'Sync Failed',
              message: 'Failed to synchronize data. Will retry automatically.'
            });
          }
        },

        addToOfflineQueue: (action: any) => {
          set(state => ({
            offlineQueue: [...state.offlineQueue, {
              ...action,
              timestamp: Date.now(),
              id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }]
          }));
        },

        processOfflineQueue: async () => {
          const { offlineQueue } = get();
          if (offlineQueue.length === 0) return;

          try {
            // Process each queued action
            for (const action of offlineQueue) {
              // In a real implementation, this would replay the actions against the server
              console.log('Processing offline action:', action);
            }
            
            set({ offlineQueue: [] });
            
            get().addNotification({
              type: 'success',
              title: 'Offline Actions Processed',
              message: `${offlineQueue.length} offline actions have been synchronized.`
            });
          } catch (error: any) {
            get().addNotification({
              type: 'error',
              title: 'Offline Sync Failed',
              message: 'Some offline actions could not be processed.'
            });
          }
        },

        setLastSyncTimestamp: (timestamp: number) => set({ lastSyncTimestamp: timestamp }),

        reset: () => set(initialState)
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          theme: state.theme,
          viewMode: state.viewMode,
          agents: state.agents,
          knowledgeBases: state.knowledgeBases,
          leads: state.leads,
          interactions: state.interactions,
          tasks: state.tasks,
          tokenUsage: state.tokenUsage,
          userDownloads: state.userDownloads,
          dynamicTexts: state.dynamicTexts,
          lastSyncTimestamp: state.lastSyncTimestamp,
          offlineQueue: state.offlineQueue
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              notifications: [],
              searchQuery: '',
              offlineQueue: []
            };
          }
          return persistedState;
        }
      }
    )
  )
);

// Selectors for optimized subscriptions
export const useUIState = () => useAppStore(state => ({
  sidebarOpen: state.sidebarOpen,
  theme: state.theme,
  activeModal: state.activeModal,
  searchQuery: state.searchQuery,
  viewMode: state.viewMode
}));

export const useNotifications = () => useAppStore(state => state.notifications);
export const useUnreadNotifications = () => useAppStore(state => 
  state.notifications.filter(n => !n.read)
);

export const useAgents = () => useAppStore(state => state.agents);
export const useKnowledgeBases = () => useAppStore(state => state.knowledgeBases);
export const useLeads = () => useAppStore(state => state.leads);
export const useInteractions = () => useAppStore(state => state.interactions);
export const useTasks = () => useAppStore(state => state.tasks);
export const useTokenUsage = () => useAppStore(state => state.tokenUsage);
export const useUserDownloads = () => useAppStore(state => state.userDownloads);

// Actions for components
export const useUIActions = () => useAppStore(state => ({
  setSidebarOpen: state.setSidebarOpen,
  toggleSidebar: state.toggleSidebar,
  setTheme: state.setTheme,
  setActiveModal: state.setActiveModal,
  setSearchQuery: state.setSearchQuery,
  setViewMode: state.setViewMode
}));

export const useNotificationActions = () => useAppStore(state => ({
  addNotification: state.addNotification,
  markNotificationRead: state.markNotificationRead,
  clearNotifications: state.clearNotifications
}));

export const useDataActions = () => useAppStore(state => ({
  setAgents: state.setAgents,
  addAgent: state.addAgent,
  updateAgent: state.updateAgent,
  removeAgent: state.removeAgent,
  setKnowledgeBases: state.setKnowledgeBases,
  addKnowledgeBase: state.addKnowledgeBase,
  updateKnowledgeBase: state.updateKnowledgeBase,
  removeKnowledgeBase: state.removeKnowledgeBase,
  setLeads: state.setLeads,
  addLead: state.addLead,
  updateLead: state.updateLead,
  removeLead: state.removeLead,
  addInteraction: state.addInteraction,
  addTask: state.addTask,
  updateTask: state.updateTask,
  removeTask: state.removeTask,
  addTokenUsage: state.addTokenUsage,
  addUserDownload: state.addUserDownload
}));

export const useSyncActions = () => useAppStore(state => ({
  syncData: state.syncData,
  addToOfflineQueue: state.addToOfflineQueue,
  processOfflineQueue: state.processOfflineQueue
}));