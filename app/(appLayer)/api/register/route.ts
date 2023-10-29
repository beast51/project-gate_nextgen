import bcrypt from 'bcrypt'

import prisma from '@/appLayer/libs/prismadb'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request
) {
  try {
    const body = await request.json()
    const {name, email, phoneNumber, carNumber, password} = body
  
    if (!name || !email || !phoneNumber || !carNumber || !password) {
      return new NextResponse('Missing info', {status: 400})
    }
  
    const hashedPassword = await bcrypt.hash(password, 12)
  
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        carNumber,
        hashedPassword
      }
    })
    
    return NextResponse.json(user)
  } catch (error: any) {
    return new NextResponse('Internal Error', {status: 500})
  }
}