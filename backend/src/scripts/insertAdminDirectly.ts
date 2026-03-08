import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

async function insertAdminDirectly() {
  const MONGODB_URI = 'mongodb+srv://morgan:koumen1234@cluster0.5t30p4l.mongodb.net/?appName=Cluster0'
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    console.log('🔄 Connexion à MongoDB...')
    await client.connect()
    console.log('✅ Connecté à MongoDB')
    
    const db = client.db() // Utilise la base par défaut de l'URI
    const adminsCollection = db.collection('admins')
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await adminsCollection.findOne({ email: 'admin@whatsapp-saas.com' })
    
    if (existingAdmin) {
      console.log('⚠️  Admin déjà existant!')
      console.log('📧 Email:', existingAdmin.email)
      console.log('👤 Nom:', existingAdmin.name)
      console.log('🎭 Rôle:', existingAdmin.role)
      await client.close()
      return
    }
    
    // Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash('Admin@2024!', 10)
    
    // Insérer le document admin
    const result = await adminsCollection.insertOne({
      email: 'admin@whatsapp-saas.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log('\n✅ Super Admin créé avec succès!')
    console.log('📧 Email: admin@whatsapp-saas.com')
    console.log('🔑 Mot de passe: Admin@2024!')
    console.log('👤 Nom: Super Admin')
    console.log('🎭 Rôle: super_admin')
    console.log('🆔 ID:', result.insertedId)
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!')
    
    await client.close()
    console.log('🔴 Connexion MongoDB fermée')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    await client.close()
    process.exit(1)
  }
}

insertAdminDirectly()
