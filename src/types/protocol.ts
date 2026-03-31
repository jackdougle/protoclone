export interface TextSegment {
  id: string;
  type: 'text';
  value: string;
}

export interface DurationSegment {
  id: string;
  type: 'duration';
  value: number;
  unit: 'sec' | 'min' | 'hr' | 'days';
}

export interface EquipmentSegment {
  id: string;
  type: 'equipment';
  value: string;
}

export interface AmountSegment {
  id: string;
  type: 'amount';
  value: number;
  unit: string;
}

export interface TemperatureSegment {
  id: string;
  type: 'temperature';
  value: number;
  unit: '°C' | '°F' | 'K';
}

export interface ReagentSegment {
  id: string;
  type: 'reagent';
  value: string;
}

export type Segment =
  | TextSegment
  | DurationSegment
  | EquipmentSegment
  | AmountSegment
  | TemperatureSegment
  | ReagentSegment;

export type SegmentType = Segment['type'];

export interface Step {
  id: string;
  segments: Segment[];
}

export interface Protocol {
  id: string;
  title: string;
  description: string;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}
