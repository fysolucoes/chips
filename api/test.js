import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    
    await client.db().admin().ping();
    await client.close();
    
    res.status(200).json({ 
      success: true, 
      message: 'Conexão MongoDB OK!',
      uri: process.env.MONGODB_URI ? 'Configurada' : 'Não configurada'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}