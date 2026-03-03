export type EventName =
    | 'app.session_started'
    | 'app.session_ended'
    | 'run.clicked'
    | 'run.completed'
    | 'submit.clicked'
    | 'submit.completed'
    | 'pebble_chat.message_sent'
    | 'pebble_chat.response_received'
    | 'ui.struggle_prompt_shown'
    | 'ui.hint_clicked'
    | 'ui.explain_clicked'
    | 'ui.next_step_clicked'

export type EventEnvironment = 'local' | 'dev' | 'prod'

export interface BaseEvent {
    eventName: EventName
    eventVersion: string
    timestamp: string // ISO string
    sessionId: string
    userId: string | null
    page: 'home' | 'problems' | 'session' | 'insights' | 'unknown'
    problemId: string | null
    language: string | null
    buildEnv: EventEnvironment
}

export interface RunCompletedEvent extends BaseEvent {
    eventName: 'run.completed'
    success: boolean
    runtimeMs: number
    errorCategory: string | null
    // explicitly DO NOT include stdout, stderr, or code here
}

export interface SubmitCompletedEvent extends BaseEvent {
    eventName: 'submit.completed'
    accepted: boolean
    runtimeMs: number
}

export interface ChatMessageEvent extends BaseEvent {
    eventName: 'pebble_chat.message_sent' | 'pebble_chat.response_received'
    messageType: 'user' | 'assistant'
    // explicitly DO NOT include raw chat content here
}

export interface GenericUIEvent extends BaseEvent {
    eventName: Exclude<
        EventName,
        'run.completed' | 'submit.completed' | 'pebble_chat.message_sent' | 'pebble_chat.response_received'
    >
}

export type PebbleEvent = RunCompletedEvent | SubmitCompletedEvent | ChatMessageEvent | GenericUIEvent
