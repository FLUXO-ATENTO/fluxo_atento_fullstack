export const dashboardMock = {
  isMock: true,
  notice: 'Ambiente demonstrativo. Nenhuma conta ou integração está conectada.',
  accountName: 'Workspace de demonstração',
  planStatus: 'A DEFINIR',
  indicators: [
    { id: 'contracted', label: 'Módulos contratados', value: 'A DEFINIR' },
    { id: 'available', label: 'Módulos disponíveis', value: 'A DEFINIR' },
    { id: 'activities', label: 'Atividades recentes', value: 'A DEFINIR' }
  ],
  contractedModules: [] as string[],
  recentActivities: [] as string[],
  alerts: [] as string[]
}
