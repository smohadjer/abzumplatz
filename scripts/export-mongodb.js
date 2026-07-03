import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { BSON, MongoClient } from 'mongodb';

dotenv.config({ quiet: true });
const DEFAULT_DATABASE_NAME = 'abzumplatz';

function printUsage() {
  console.log(`Usage: npm run export:db -- [options]

Options:
  --db <name>           Database name (default: ${DEFAULT_DATABASE_NAME})
  --out <directory>     Output directory (default: backups/export_TIMESTAMP)
  --collections <list>  Comma-separated collection names to export
  --help                Show this help message

Environment:
  db_uri                MongoDB connection string
  db_name               Optional database name override
`);
}

function parseArgs(argv) {
  const options = {
    dbName: process.env.db_name || DEFAULT_DATABASE_NAME,
    collections: null,
    outDir: path.join(
      process.cwd(),
      'backups',
      `export_${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)}`
    ),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--db') {
      options.dbName = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--out') {
      options.outDir = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === '--collections') {
      options.collections = argv[index + 1]
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function resolveDatabaseUri() {
  if (!process.env.db_uri) {
    throw new Error('Missing db_uri in environment. Add db_uri to your .env file.');
  }

  return process.env.db_uri;
}

async function exportCollection(database, collectionName, outDir, dbName) {
  const documents = await database.collection(collectionName).find({}).toArray();
  const serialized = BSON.EJSON.serialize(documents);
  const outputPath = path.join(outDir, `${dbName}.${collectionName}.json`);

  await fs.writeFile(outputPath, JSON.stringify(serialized, null, 2));

  return {
    collectionName,
    count: documents.length,
    outputPath,
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const databaseUri = resolveDatabaseUri();
  const client = new MongoClient(databaseUri);

  try {
    await fs.mkdir(options.outDir, { recursive: true });
    await client.connect();

    const database = client.db(options.dbName);
    const collectionNames =
      options.collections ??
      (await database.listCollections({}, { nameOnly: true }).toArray())
        .map((collection) => collection.name)
        .sort((left, right) => left.localeCompare(right));

    if (collectionNames.length === 0) {
      console.log(`No collections found in database "${options.dbName}".`);
      return;
    }

    const results = [];

    for (const collectionName of collectionNames) {
      const result = await exportCollection(database, collectionName, options.outDir, options.dbName);
      results.push(result);
      console.log(`Exported ${collectionName}: ${result.count} documents -> ${result.outputPath}`);
    }

    const manifestPath = path.join(options.outDir, 'manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(
        {
          database: options.dbName,
          exportedAt: new Date().toISOString(),
          collections: results.map(({ collectionName, count, outputPath }) => ({
            collectionName,
            count,
            file: path.basename(outputPath),
          })),
        },
        null,
        2
      )
    );

    console.log(`Wrote manifest -> ${manifestPath}`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
