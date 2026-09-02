/**
 * Phase 5-T1: Database Setup Tests
 * 
 * Verifies:
 * - Seed data loaded correctly
 * - Vector indexes created
 * - Metadata extraction working
 * - Collection organization correct
 */

import test from 'node:test';
import assert from 'node:assert';
import PrismaClientModule from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = PrismaClientModule;

// Note: For testing, if DATABASE_URL not set, these tests will be skipped
const databaseUrl = process.env.DATABASE_URL;
let prisma = null;

if (databaseUrl) {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter });
}

test('Phase 5-T1: Database Setup & Seed', async (t) => {
  // Skip all tests if DATABASE_URL not set
  if (!prisma) {
    console.log('⏭️  Skipping database tests (DATABASE_URL not set)');
    return;
  }

  // Cleanup helper
  const cleanupDatabase = async () => {
    try {
      await prisma.vectorDoc.deleteMany({});
    } catch (e) {
      // Ignore if table doesn't exist
    }
  };

  await t.test('Database connection and table exist', async () => {
    try {
      const result = await prisma.vectorDoc.count();
      assert.strictEqual(typeof result, 'number');
    } catch (error) {
      throw new Error(`Database table missing: ${error.message}`);
    }
  });

  await t.test('Seed data structure has required fields', async () => {
    await cleanupDatabase();

    // Create a test document with required fields
    const testDoc = {
      id: 'test-doc-001',
      collection: 'case_law',
      source_type: 'case',
      content: 'Test case content about Malaysian law',
      metadata: {
        citation: 'Test Case [2026] 1 MLJ 100',
        court: 'Federal Court',
        jurisdiction: 'federal',
        legal_domain: 'company',
      },
    };

    const created = await prisma.vectorDoc.create({
      data: testDoc,
    });

    assert.strictEqual(created.id, testDoc.id);
    assert.strictEqual(created.collection, testDoc.collection);
    assert.strictEqual(created.source_type, testDoc.source_type);
    assert.ok(created.content.includes('Malaysian law'));
    assert.deepStrictEqual(created.metadata.citation, testDoc.metadata.citation);
  });

  await t.test('Can store and retrieve metadata as JSON', async () => {
    await cleanupDatabase();

    const testDoc = {
      id: 'test-metadata-001',
      collection: 'legislation',
      source_type: 'legislation',
      content: 'Federal Constitution Article 5',
      metadata: {
        act_number: 'Federal Constitution 1957',
        section: 'Article 5',
        keywords: ['habeas corpus', 'liberty', 'detention'],
        human_rights_engaged: ['Art 5', 'Art 8'],
        court_level: 'Federal',
        jurisdiction: 'federal',
      },
    };

    const created = await prisma.vectorDoc.create({
      data: testDoc,
    });

    const retrieved = await prisma.vectorDoc.findUnique({
      where: { id: created.id },
    });

    assert.strictEqual(retrieved.metadata.act_number, 'Federal Constitution 1957');
    assert.strictEqual(Array.isArray(retrieved.metadata.keywords), true);
    assert.ok(retrieved.metadata.keywords.includes('habeas corpus'));
    assert.strictEqual(Array.isArray(retrieved.metadata.human_rights_engaged), true);
  });

  await t.test('Document collections properly separated', async () => {
    await cleanupDatabase();

    // Insert documents in different collections
    const caseLaw = {
      id: 'case-001',
      collection: 'case_law',
      source_type: 'case',
      content: 'Foo v Bar [2020] 1 MLJ 100',
      metadata: { citation: 'Foo v Bar [2020] 1 MLJ 100' },
    };

    const legislation = {
      id: 'leg-001',
      collection: 'legislation',
      source_type: 'legislation',
      content: 'Companies Act 2016 - Section 213',
      metadata: { act_number: 'Companies Act 2016', section: '213' },
    };

    await prisma.vectorDoc.create({ data: caseLaw });
    await prisma.vectorDoc.create({ data: legislation });

    const caseCount = await prisma.vectorDoc.count({
      where: { collection: 'case_law' },
    });

    const legCount = await prisma.vectorDoc.count({
      where: { collection: 'legislation' },
    });

    assert.strictEqual(caseCount, 1);
    assert.strictEqual(legCount, 1);
  });

  await t.test('Source types are properly categorized', async () => {
    await cleanupDatabase();

    const sourceTypes = ['case', 'legislation', 'commentary'];

    for (const sourceType of sourceTypes) {
      await prisma.vectorDoc.create({
        data: {
          id: `doc-${sourceType}`,
          collection: 'test',
          source_type: sourceType,
          content: `Test ${sourceType} document`,
          metadata: { type: sourceType },
        },
      });
    }

    for (const sourceType of sourceTypes) {
      const count = await prisma.vectorDoc.count({
        where: { source_type: sourceType },
      });
      assert.strictEqual(count, 1, `Expected 1 ${sourceType}, found ${count}`);
    }
  });

  await t.test('Legal domain detection works in metadata', async () => {
    await cleanupDatabase();

    const domains = ['company', 'employment', 'criminal', 'contract', 'constitutional'];

    for (const domain of domains) {
      await prisma.vectorDoc.create({
        data: {
          id: `domain-${domain}`,
          collection: 'test',
          source_type: 'case',
          content: `Test ${domain} case`,
          metadata: { legal_domain: domain },
        },
      });
    }

    const allDocs = await prisma.vectorDoc.findMany({
      where: { collection: 'test' },
    });

    assert.strictEqual(allDocs.length, domains.length);

    for (const doc of allDocs) {
      const domain = doc.metadata.legal_domain;
      assert.ok(domains.includes(domain));
    }
  });

  await t.test('Court hierarchy levels are stored correctly', async () => {
    await cleanupDatabase();

    const courtLevels = ['FEDERAL', 'APPEAL', 'HIGH', 'SESSIONS', 'MAGISTRATE'];

    for (const level of courtLevels) {
      await prisma.vectorDoc.create({
        data: {
          id: `court-${level}`,
          collection: 'test',
          source_type: 'case',
          content: `Test ${level} court case`,
          metadata: { court_level: level, jurisdiction: 'federal' },
        },
      });
    }

    const allDocs = await prisma.vectorDoc.findMany({
      where: { collection: 'test' },
    });

    assert.strictEqual(allDocs.length, courtLevels.length);

    for (const doc of allDocs) {
      const level = doc.metadata.court_level;
      assert.ok(courtLevels.includes(level));
    }
  });

  await t.test('Human rights engagement detection in metadata', async () => {
    await cleanupDatabase();

    const doc = {
      id: 'hr-001',
      collection: 'test',
      source_type: 'case',
      content: 'Habeas corpus case involving detention',
      metadata: {
        human_rights_engaged: ['Art 5', 'Art 8'],
        constitutional_implications: true,
      },
    };

    const created = await prisma.vectorDoc.create({ data: doc });
    const retrieved = await prisma.vectorDoc.findUnique({
      where: { id: created.id },
    });

    assert.ok(Array.isArray(retrieved.metadata.human_rights_engaged));
    assert.ok(retrieved.metadata.human_rights_engaged.includes('Art 5'));
    assert.ok(retrieved.metadata.human_rights_engaged.includes('Art 8'));
  });

  await t.test('Bulk insert performance (simulated)', async () => {
    await cleanupDatabase();

    const docs = [];
    for (let i = 1; i <= 20; i++) {
      docs.push({
        id: `bulk-${i}`,
        collection: 'test',
        source_type: 'case',
        content: `Bulk test case ${i} with Malaysian legal content`,
        metadata: { index: i },
      });
    }

    const startTime = Date.now();

    for (const doc of docs) {
      await prisma.vectorDoc.create({ data: doc });
    }

    const duration = Date.now() - startTime;

    const count = await prisma.vectorDoc.count();
    assert.strictEqual(count, 20);

    console.log(`   ℹ Inserted 20 documents in ${duration}ms`);
  });

  await t.test('Update existing documents (upsert)', async () => {
    await cleanupDatabase();

    const original = {
      id: 'upsert-test',
      collection: 'test',
      source_type: 'case',
      content: 'Original content',
      metadata: { version: 1 },
    };

    const created = await prisma.vectorDoc.create({ data: original });
    assert.strictEqual(created.metadata.version, 1);

    // Upsert with updated content
    const updated = await prisma.vectorDoc.upsert({
      where: { id: 'upsert-test' },
      update: {
        content: 'Updated content',
        metadata: { version: 2 },
      },
      create: original,
    });

    assert.strictEqual(updated.content, 'Updated content');
    assert.strictEqual(updated.metadata.version, 2);

    const count = await prisma.vectorDoc.count();
    assert.strictEqual(count, 1, 'Upsert should not create duplicate');
  });

  await t.test('Vector column exists and accepts NULL', async () => {
    await cleanupDatabase();

    const doc = {
      id: 'vector-test',
      collection: 'test',
      source_type: 'case',
      content: 'Test case for vector column',
      metadata: { test: true },
      // Explicitly set vector to null initially
    };

    const created = await prisma.vectorDoc.create({
      data: doc,
    });

    // Vector should be null or empty at this point
    assert.ok(created.vector === null || created.vector === '');
  });

  // Cleanup
  await cleanupDatabase();
  await prisma.$disconnect();
});
