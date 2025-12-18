// api/chips.js
import { MongoClient, ObjectId } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  const db = client.db('planilha_chips');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // ===== CORS =====
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('chips');

    // ===== GET - Listar todos =====
    if (req.method === 'GET') {
      const chips = await collection.find({}).sort({ createdAt: -1 }).toArray();

      const chipsFormatados = chips.map(item => ({
        ...item,
        _id: item._id.toString(), 
      }));

      return res.status(200).json({
        success: true,
        data: chipsFormatados,
      });
    }

    // ===== POST - Criar =====
    if (req.method === 'POST') {
      const { equipe, coordenador, numero, data, status } = req.body;

      if (!equipe || !coordenador || !numero || !data || !status) {
        return res.status(400).json({
          success: false,
          error: 'Todos os campos são obrigatórios',
        });
      }

      const novoItem = {
        equipe,
        coordenador,
        numero,
        data,
        status,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(novoItem);

      return res.status(201).json({
        success: true,
        data: {
          ...novoItem,
          _id: result.insertedId.toString(),
        },
      });
    }

    // ===== PUT - Atualizar =====
    if (req.method === 'PUT') {
      const { id, equipe, coordenador, numero, data, status } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID é obrigatório',
        });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
        });
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            equipe,
            coordenador,
            numero,
            data,
            status,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Item não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Item atualizado com sucesso',
      });
    }

    // ===== DELETE - Remover =====
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID é obrigatório',
        });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
        });
      }

      const result = await collection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Item não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Item removido com sucesso',
      });
    }

    // ===== Método inválido =====
    return res.status(405).json({
      success: false,
      error: 'Método não permitido',
    });

  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
