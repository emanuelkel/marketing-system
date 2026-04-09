import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Agency
  const agency = await prisma.agency.upsert({
    where: { slug: "minha-agencia" },
    update: {},
    create: {
      name: "Minha Agência",
      slug: "minha-agencia",
      primaryColor: "#6366f1",
    },
  });
  console.log("✅ Agency criada:", agency.name);

  const hash = await bcrypt.hash("senha123", 12);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@agencia.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@agencia.com",
      passwordHash: hash,
      role: "ADMIN",
      agencyId: agency.id,
      isActive: true,
    },
  });
  console.log("✅ Admin criado:", admin.email);

  // Employee
  const employee = await prisma.user.upsert({
    where: { email: "designer@agencia.com" },
    update: {},
    create: {
      name: "Ana Designer",
      email: "designer@agencia.com",
      passwordHash: hash,
      role: "EMPLOYEE",
      agencyId: agency.id,
      isActive: true,
    },
  });
  console.log("✅ Employee criada:", employee.email);

  // Client 1
  const client1 = await prisma.client.upsert({
    where: { slug: "loja-da-maria" },
    update: {},
    create: {
      name: "Loja da Maria",
      slug: "loja-da-maria",
      instagramHandle: "lojadamaria",
      whatsappNumber: "+5511999999901",
      timezone: "America/Sao_Paulo",
      agencyId: agency.id,
      brandColors: { primary: "#E91E63", secondary: "#FCE4EC" },
    },
  });

  const clientUser1 = await prisma.user.upsert({
    where: { email: "maria@lojadamaria.com" },
    update: {},
    create: {
      name: "Maria Silva",
      email: "maria@lojadamaria.com",
      passwordHash: hash,
      role: "CLIENT",
      clientId: client1.id,
      agencyId: agency.id,
      phone: "+5511999999901",
      isActive: true,
    },
  });
  console.log("✅ Cliente 1 criado:", client1.name, "| User:", clientUser1.email);

  // Client 2
  const client2 = await prisma.client.upsert({
    where: { slug: "restaurante-do-joao" },
    update: {},
    create: {
      name: "Restaurante do João",
      slug: "restaurante-do-joao",
      instagramHandle: "restdojoao",
      whatsappNumber: "+5511999999902",
      timezone: "America/Sao_Paulo",
      agencyId: agency.id,
      brandColors: { primary: "#FF5722", secondary: "#FBE9E7" },
    },
  });

  const clientUser2 = await prisma.user.upsert({
    where: { email: "joao@restaurante.com" },
    update: {},
    create: {
      name: "João Santos",
      email: "joao@restaurante.com",
      passwordHash: hash,
      role: "CLIENT",
      clientId: client2.id,
      agencyId: agency.id,
      phone: "+5511999999902",
      isActive: true,
    },
  });
  console.log("✅ Cliente 2 criado:", client2.name, "| User:", clientUser2.email);

  // Sample posts for client1
  const post1 = await prisma.post.create({
    data: {
      title: "Promoção de Verão",
      caption: "Aproveite nossa promoção de verão! Até 50% off em toda a loja. 🌞",
      hashtags: ["promoção", "moda", "verão", "lojadamaria"],
      network: "INSTAGRAM",
      status: "PENDING_APPROVAL",
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      clientId: client1.id,
      position: 1,
    },
  });

  await prisma.approval.create({
    data: {
      postId: post1.id,
      status: "PENDING",
      requestedById: admin.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Nova coleção outono/inverno",
      caption: "Chegou! Nossa nova coleção outono/inverno 2026. 🍂",
      hashtags: ["novacoleção", "outono", "inverno", "moda"],
      network: "INSTAGRAM",
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      clientId: client1.id,
      position: 2,
    },
  });

  await prisma.post.create({
    data: {
      title: "Story - Enquete de looks",
      caption: "Qual look você prefere? Vote nos stories!",
      hashtags: [],
      network: "INSTAGRAM_STORY",
      status: "DRAFT",
      clientId: client1.id,
      position: 3,
    },
  });

  // Sample art request
  await prisma.artRequest.create({
    data: {
      title: "Banner para Dia das Mães",
      type: "BANNER",
      status: "OPEN",
      briefing:
        "Preciso de um banner para o Dia das Mães. Cores: rosa e dourado. Incluir flores e mensagem 'Feliz Dia das Mães'. Formato: 1080x1080 para Instagram e 1200x628 para Facebook.",
      format: "1080x1080",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 1,
      clientId: client1.id,
      requestedById: clientUser1.id,
    },
  });

  console.log("✅ Posts e solicitações de exemplo criados");
  console.log("\n🎉 Seed concluído!");
  console.log("\n📧 Contas de acesso (senha: senha123):");
  console.log("  Admin:    admin@agencia.com");
  console.log("  Equipe:   designer@agencia.com");
  console.log("  Cliente 1: maria@lojadamaria.com");
  console.log("  Cliente 2: joao@restaurante.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
