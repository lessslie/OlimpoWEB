// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Propiedad calculada
  phone: string;
  is_admin: boolean;
  created_at: Date;
  updated_at?: Date;
}

@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(
    userData: Omit<User, 'id' | 'created_at' | 'full_name'>,
  ): Promise<User> {
    const newUser: User = {
      id: uuidv4(),
      ...userData,
      full_name: `${userData.first_name} ${userData.last_name}`.trim(),
      is_admin: userData.is_admin || false,
      created_at: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async findAll(): Promise<User[]> {
    return this.users.map((user) => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name}`.trim(),
    }));
  }

  async findOne(id: string): Promise<User | undefined> {
    const user = this.users.find((user) => user.id === id);
    if (user) {
      return {
        ...user,
        full_name: `${user.first_name} ${user.last_name}`.trim(),
      };
    }
    return undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = this.users.find((user) => user.email === email);
    if (user) {
      return {
        ...user,
        full_name: `${user.first_name} ${user.last_name}`.trim(),
      };
    }
    return undefined;
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return null;

    // Si se actualiza first_name o last_name, actualizar también full_name
    let fullName = this.users[userIndex].full_name;
    if (userData.first_name || userData.last_name) {
      const firstName = userData.first_name || this.users[userIndex].first_name;
      const lastName = userData.last_name || this.users[userIndex].last_name;
      fullName = `${firstName} ${lastName}`.trim();
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      full_name: fullName,
      updated_at: new Date(),
    };

    return this.users[userIndex];
  }

  async remove(id: string): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return null;

    const deletedUser = this.users[userIndex];
    this.users.splice(userIndex, 1);
    return deletedUser;
  }
}
