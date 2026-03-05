import { env } from '../config/env.js'

export interface VerifyInstanceParams {
  instanceId: string
  apiKey: string
}

export interface SendMessageParams {
  instanceId: string
  apiKey: string
  number: string
  text: string
}

export async function verifyWhatsAppInstance({ instanceId, apiKey }: VerifyInstanceParams) {
  console.log("\n=========== VERIFY WHATSAPP INSTANCE ===========")
  console.log("📱 Instance ID:", instanceId)
  console.log("🔑 API Key present:", apiKey ? "YES" : "NO")

  if (!instanceId || !apiKey) {
    console.log("❌ Missing credentials")
    throw new Error("MISSING_CREDENTIALS")
  }

  const url = `${env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/api/v1/instance/status`

  console.log("🌍 Calling:", url)

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}` 
    },
    body: JSON.stringify({ instanceId })
  })

  const raw = await res.text()

  console.log("📡 Status:", res.status)
  console.log("📡 Raw response:", raw)

  if (!res.ok) {
    console.log("❌ Instance verification failed")
    throw new Error("INSTANCE_VERIFICATION_FAILED")
  }

  console.log("✅ Instance verified successfully")
  console.log("================================================\n")

  return JSON.parse(raw)
}

export async function sendWhatsAppMessage({ instanceId, apiKey, number, text }: SendMessageParams) {
  console.log("\n============== SEND WHATSAPP MESSAGE ==============")

  console.log("📱 Instance ID:", instanceId)
  console.log("📞 Number:", number)
  console.log("💬 Text:", text)

  const url = `${env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/api/v1/message/sendText`

  console.log("🌍 Calling:", url)

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}` 
    },
    body: JSON.stringify({
      instanceId,
      number,
      text
    })
  })

  const raw = await res.text()

  console.log("📡 Status:", res.status)
  console.log("📡 Response:", raw)

  if (!res.ok) {
    console.log("❌ WhatsApp send failed")
    throw new Error("WHATSAPP_SEND_FAILED")
  }

  console.log("✅ Message sent successfully")
  console.log("====================================================\n")

  return JSON.parse(raw)
}
