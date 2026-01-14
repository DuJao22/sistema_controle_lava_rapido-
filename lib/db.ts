
// Este arquivo deve ser usado apenas dentro das API Routes (Server-side)
// Documentação: https://sqlitecloud.io/docs/introduction

export interface SQLiteCloudConfig {
  connectionString: string;
}

const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_CONNECTION_STRING;

export async function query(sql: string, params: any[] = []) {
  if (!SQLITE_CLOUD_URL) {
    throw new Error('SQLITE_CLOUD_CONNECTION_STRING não configurada.');
  }

  // Nota: Em um ambiente Next.js real, usaríamos o driver oficial 'sqlitecloud-js'.
  // Aqui simulamos a chamada via interface de API que o SQLite Cloud provê.
  const response = await fetch(`${SQLITE_CLOUD_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SQLITE_CLOUD_API_KEY}`
    },
    body: JSON.stringify({ sql, params })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro na consulta ao SQLite Cloud');
  }

  return response.json();
}
