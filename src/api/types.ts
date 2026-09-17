import type { components } from './generated';

export type LoginRequest = components['schemas']['LoginRequest'];
export type UserRole = components['schemas']['UserRole'];
export type CurrentPrincipal = components['schemas']['CurrentPrincipal'];
export type IdentityType = components['schemas']['IdentityType'];
export type UserAccount = components['schemas']['UserAccount'];
export type UserCreateRequest = components['schemas']['UserCreateRequest'];
export type UserUpdateRequest = components['schemas']['UserUpdateRequest'];

export type Source = components['schemas']['Source'];
export type SourceType = components['schemas']['SourceType'];
export type SourceUpsertRequest = components['schemas']['SourceUpsertRequest'];
export type SourceTestStatus = components['schemas']['SourceTestStatus'];
export type SourceTestPreviewItem = components['schemas']['SourceTestPreviewItem'];
export type SourceTestResult = components['schemas']['SourceTestResult'];

export type MonitoringProfile = components['schemas']['MonitoringProfile'];
export type MonitoringProfileUpsertRequest = components['schemas']['MonitoringProfileUpsertRequest'];

export type CollectionRunRequest = components['schemas']['CollectionRunRequest'];
export type CollectionRun = components['schemas']['CollectionRun'];
export type CollectionSourceRun = components['schemas']['CollectionSourceRun'];
export type AnalysisItemInspection = components['schemas']['AnalysisItemInspection'];

export type ResultSummary = components['schemas']['ResultSummary'];
export type ResultDetail = components['schemas']['ResultDetail'];

export type ResultLiveEvent = components['schemas']['ResultLiveEvent'];
export type ObservedEvent = components['schemas']['ObservedEvent'];
export type ObservedEventLiveEvent = components['schemas']['ObservedEventLiveEvent'];

export type ProcessingFlow = components['schemas']['ProcessingFlow'];
export type ProcessingFlowNode = components['schemas']['ProcessingFlowNode'];
export type ProcessingFlowEdge = components['schemas']['ProcessingFlowEdge'];
