export interface Item {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemRequest {
  name: string;
  description: string;
  active: boolean;
}
