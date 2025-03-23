// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_admin: boolean;
  created_at: Date;
  updated_at?: Date;
}

@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const newUser: User = {
      id: uuidv4(),
      ...userData,
      is_admin: userData.is_admin || false,
      created_at: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findOne(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updated_at: new Date(),
    };
    
    return this.users[userIndex];
  }

  async remove(id: string): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    const deletedUser = this.users[userIndex];
    this.users.splice(userIndex, 1);
    return deletedUser;
  }
}
