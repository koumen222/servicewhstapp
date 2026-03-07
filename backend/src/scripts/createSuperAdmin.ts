import { connectMongo, closeMongo } from '../lib/mongo.js'
import { AdminService } from '../services/adminService.js'

async function createSuperAdmin() {
  try {
    console.log('🔄 Connexion à MongoDB...')
    await connectMongo()

    const email = 'admin@whatsapp-saas.com'
    const password = 'Admin@2024!'
    const name = 'Super Admin'

    console.log('👤 Création du compte super admin...')
    const admin = await AdminService.createSuperAdmin(email, password, name)

    console.log('\n✅ Compte super admin créé avec succès!')
    console.log('📧 Email:', email)
    console.log('🔑 Mot de passe:', password)
    console.log('👤 Nom:', name)
    console.log('🎭 Rôle:', admin.role)
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!')
    console.log('🌐 Accédez au dashboard admin sur: http://localhost:3000/admin')

    await closeMongo()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    await closeMongo()
    process.exit(1)
  }
}

createSuperAdmin()
