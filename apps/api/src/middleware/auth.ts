import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../services/supabase'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' })
    return
  }

  const token = authHeader.replace('Bearer ', '')

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Token inválido o expirado' })
    return
  }

  req.userId = user.id
  req.userEmail = user.email
  next()
}
