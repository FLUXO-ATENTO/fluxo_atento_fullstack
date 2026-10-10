export type ModuleId =
  | 'recuperaia'
  | 'adsguard'
  | 'atendescore'
  | 'contratovivo'
  | 'compracerta'
  | 'leadradar'

export type ModuleStatus =
  | 'active'
  | 'blocked'
  | 'in_implementation'
  | 'available_for_upgrade'
  | 'to_define'

export type ModuleAvailability = 'available' | 'unavailable' | 'upgrade' | 'to_define'

export interface ProductModule {
  id: ModuleId
  name: string
  shortDescription: string
  longDescription: string
  category: string
  icon: string
  visualColor: string
  status: ModuleStatus
  plannedFeatures: string[]
  route: string
  minimumPlan: string
  availability: ModuleAvailability
}

export const moduleStatusLabels: Record<ModuleStatus, string> = {
  active: 'Ativo',
  blocked: 'Bloqueado',
  in_implementation: 'Em implantação',
  available_for_upgrade: 'Disponível para upgrade',
  to_define: 'A DEFINIR'
}
