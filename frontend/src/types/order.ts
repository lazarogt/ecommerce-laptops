import type { User } from "./user";

export interface Order {
  id:string;
  customerName:string;
  customerPhone?:string | null;
  total:number;
  status:string;
  createdAt?:string;
  updateAt?:string;
  User?:User | null;
}