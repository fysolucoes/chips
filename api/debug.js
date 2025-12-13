// api/debug.js
export default async function handler(req, res) {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return res.status(500).json({ 
        success: false, 
        error: 'MONGODB_URI não configurada'
      });
    }

    // Extrair informações sem expor a senha completa
    const uriParts = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)/);
    
    if (!uriParts) {
      return res.status(500).json({
        success: false,
        error: 'Formato da URI inválido',
        format: 'Deve ser: mongodb+srv://user:pass@cluster.mongodb.net'
      });
    }

    const [, username, password, cluster] = uriParts;

    return res.status(200).json({
      success: true,
      info: {
        username: username,
        passwordLength: password.length,
        passwordStart: password.substring(0, 3) + '***',
        cluster: cluster,
        hasSpecialChars: /[^a-zA-Z0-9]/.test(password),
        specialChars: password.match(/[^a-zA-Z0-9]/g) || [],
        fullURILength: uri.length
      },
      tip: 'Se hasSpecialChars=true, você precisa fazer URL encoding da senha'
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}