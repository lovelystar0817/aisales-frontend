export interface MessageFeedback {
  type: 'praise' | 'suggestion' | 'insight' | 'warning' | 'error' | 'none';
  content: string;
}

export interface Message {
  role: string;
  author?: string;
  content: string;
  sent: Date;
  feedback?: MessageFeedback;
}

export interface Extended {
  _id: string;
  elements: Element[];
  type: string;
  title: string;
}

export interface Element {
  _id: string;
  content: string;
  type: string;
  icon?: string;
}
