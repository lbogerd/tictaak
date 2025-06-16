'use server'

import { db } from './prisma'
import { revalidatePath } from 'next/cache'

// Task actions
export async function createTask(title: string, categoryId: string) {
  const task = await db.task.create({
    data: {
      title,
      categoryId,
    },
    include: {
      category: true,
    },
  })
  
  revalidatePath('/')
  return task
}

export async function getTasks() {
  return await db.task.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function deleteTask(id: string) {
  await db.task.delete({
    where: { id },
  })
  
  revalidatePath('/')
}

// Category actions
export async function createCategory(name: string) {
  const category = await db.category.create({
    data: { name },
  })
  
  revalidatePath('/')
  return category
}

export async function getCategories() {
  return await db.category.findMany({
    orderBy: {
      name: 'asc',
    },
  })
}

export async function deleteCategory(id: string) {
  await db.category.delete({
    where: { id },
  })
  
  revalidatePath('/')
}

// Initialize default categories
export async function initializeDefaultCategories() {
  const existingCategories = await db.category.count()
  
  if (existingCategories === 0) {
    const defaultCategories = ['Personal', 'Work', 'Health', 'Shopping', 'Projects']
    
    await db.category.createMany({
      data: defaultCategories.map(name => ({ name })),
    })
  }
}