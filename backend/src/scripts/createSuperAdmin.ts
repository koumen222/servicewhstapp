import { connectMongoose, disconnectMongoose } from '../lib/mongoose.js'
import { AdminService } from '../services/adminService.js'

async function createSuperAdmin() {
  try {
    console.log('🔄 Connexion à MongoDB...')
    await connectMongoose()

    const email = 'koumenprive@gmail.com'
    const password = 'Koumen@22'
    const name = 'Koumen Admin'

    console.log('👤 Création du compte super admin...')
    const admin = await AdminService.createSuperAdmin(email, password, name)

    console.log('\n✅ Compte super admin créé avec succès!')
    console.log('📧 Email:', email)
    console.log('🔑 Mot de passe:', password)
    console.log('👤 Nom:', name)
    console.log('🎭 Rôle:', admin.role)
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!')
    console.log('🌐 Accédez au dashboard admin sur: http://localhost:3000/admin')

    await disconnectMongoose()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    await disconnectMongoose()
    process.exit(1)
  }
}

createSuperAdmin()
