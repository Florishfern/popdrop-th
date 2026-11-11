const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const usersData = [
  {
    "name": "Kraig Schuppe",
    "email": "test1@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/74636236",
    "emailVerified": "2026-11-10T11:07:35.876Z"
  },
  {
    "name": "Tre Boyer",
    "email": "test2@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/48557258",
    "emailVerified": "2026-11-10T23:55:37.723Z"
  },
  {
    "name": "Murl Durgan V",
    "email": "test3@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/59.jpg",
    "emailVerified": "2026-11-11T06:34:50.629Z"
  },
  {
    "name": "Karen Toy",
    "email": "test4@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/39881444",
    "emailVerified": "2026-11-11T02:10:15.081Z"
  },
  {
    "name": "Ms. Myrtis Bogisich",
    "email": "test5@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/75487848",
    "emailVerified": "2026-11-10T14:58:38.592Z"
  },
  {
    "name": "Francis Kertzmann",
    "email": "test6@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/14431880",
    "emailVerified": "2026-11-11T02:53:35.678Z"
  },
  {
    "name": "Mr. Zachary Botsford-Waters",
    "email": "test7@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/30.jpg",
    "emailVerified": "2026-11-10T21:33:55.127Z"
  },
  {
    "name": "Wanda Wunsch",
    "email": "test8@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/90998893",
    "emailVerified": "2026-11-11T03:52:44.726Z"
  },
  {
    "name": "Alexanne Schumm",
    "email": "test9@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/68445327",
    "emailVerified": "2026-11-11T07:09:09.473Z"
  },
  {
    "name": "Maurice Kautzer",
    "email": "test10@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/13393232",
    "emailVerified": "2026-11-10T10:53:16.163Z"
  },
  {
    "name": "Jessie Graham",
    "email": "test11@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/87623353",
    "emailVerified": "2026-11-11T04:05:08.895Z"
  },
  {
    "name": "Myrl Kassulke MD",
    "email": "test12@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/27.jpg",
    "emailVerified": "2026-11-10T13:27:05.628Z"
  },
  {
    "name": "Miss Daphne Huels I",
    "email": "test13@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/13.jpg",
    "emailVerified": "2026-11-10T23:42:38.516Z"
  },
  {
    "name": "Arnoldo Mueller",
    "email": "test14@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/0.jpg",
    "emailVerified": "2026-11-10T21:22:22.394Z"
  },
  {
    "name": "Green Predovic",
    "email": "test15@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/96.jpg",
    "emailVerified": "2026-11-11T01:07:34.370Z"
  },
  {
    "name": "Douglas Boyer",
    "email": "test16@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/58135673",
    "emailVerified": "2026-11-10T17:22:27.087Z"
  },
  {
    "name": "Luis Hilll",
    "email": "test17@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/97.jpg",
    "emailVerified": "2026-11-11T07:51:31.551Z"
  },
  {
    "name": "Nikko Price-Grady",
    "email": "test18@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/6052206",
    "emailVerified": "2026-11-11T04:12:22.450Z"
  },
  {
    "name": "Traci Nienow",
    "email": "test19@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/49.jpg",
    "emailVerified": "2026-11-10T23:50:43.523Z"
  },
  {
    "name": "Jeffry Bins",
    "email": "test20@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/63274109",
    "emailVerified": "2026-11-11T08:19:09.843Z"
  },
  {
    "name": "Mr. Hyman Turcotte",
    "email": "test21@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/49.jpg",
    "emailVerified": "2026-11-10T21:45:59.047Z"
  },
  {
    "name": "Aiyana Macejkovic",
    "email": "test22@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/77850943",
    "emailVerified": "2026-11-10T14:36:31.636Z"
  },
  {
    "name": "Brittany Upton",
    "email": "test23@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/33420082",
    "emailVerified": "2026-11-11T04:28:17.261Z"
  },
  {
    "name": "Mrs. Kate Ziemann",
    "email": "test24@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/81149489",
    "emailVerified": "2026-11-10T15:14:30.346Z"
  },
  {
    "name": "Isabella Raynor",
    "email": "test25@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/91.jpg",
    "emailVerified": "2026-11-10T21:13:14.296Z"
  },
  {
    "name": "Sydney Predovic",
    "email": "test26@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/24954018",
    "emailVerified": "2026-11-10T13:39:43.927Z"
  },
  {
    "name": "Orrin Dickinson",
    "email": "test27@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/26257576",
    "emailVerified": "2026-11-10T13:26:37.874Z"
  },
  {
    "name": "Abner Robel",
    "email": "test28@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/15388030",
    "emailVerified": "2026-11-11T08:15:53.436Z"
  },
  {
    "name": "Lelah Fisher",
    "email": "test29@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/29548001",
    "emailVerified": "2026-11-10T21:23:09.815Z"
  },
  {
    "name": "Shanel King IV",
    "email": "test30@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/12957867",
    "emailVerified": "2026-11-11T03:30:17.285Z"
  },
  {
    "name": "Michel Gulgowski DVM",
    "email": "test31@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/52.jpg",
    "emailVerified": "2026-11-10T21:38:20.966Z"
  },
  {
    "name": "Ronny Oberbrunner IV",
    "email": "test32@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/76949855",
    "emailVerified": "2026-11-10T10:54:25.322Z"
  },
  {
    "name": "Derrick Boehm",
    "email": "test33@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/75421077",
    "emailVerified": "2026-11-10T12:53:37.021Z"
  },
  {
    "name": "Pierce Gulgowski-Homenick V",
    "email": "test34@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/46584863",
    "emailVerified": "2026-11-10T14:03:14.121Z"
  },
  {
    "name": "Audreanne Bayer",
    "email": "test35@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/75244089",
    "emailVerified": "2026-11-10T13:46:23.335Z"
  },
  {
    "name": "Miss Cristina Kuhn-Huels",
    "email": "test36@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/56874023",
    "emailVerified": "2026-11-10T18:52:34.915Z"
  },
  {
    "name": "Ms. Miranda Hoeger",
    "email": "test37@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/44705502",
    "emailVerified": "2026-11-11T09:16:19.539Z"
  },
  {
    "name": "Marguerite Frami",
    "email": "test38@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/994802",
    "emailVerified": "2026-11-10T14:46:36.503Z"
  },
  {
    "name": "Issac Gorczany-Denesik",
    "email": "test39@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/8.jpg",
    "emailVerified": "2026-11-10T22:45:24.114Z"
  },
  {
    "name": "Malinda Sauer",
    "email": "test40@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/65.jpg",
    "emailVerified": "2026-11-10T18:21:04.384Z"
  },
  {
    "name": "Cristal Robel",
    "email": "test41@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/29633674",
    "emailVerified": "2026-11-10T20:09:55.540Z"
  },
  {
    "name": "Mrs. Verdie Gulgowski",
    "email": "test42@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/47791467",
    "emailVerified": "2026-11-11T03:09:45.232Z"
  },
  {
    "name": "Jaydon Erdman Jr.",
    "email": "test43@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/5.jpg",
    "emailVerified": "2026-11-11T06:48:02.947Z"
  },
  {
    "name": "Rhoda Bradtke",
    "email": "test44@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/13828799",
    "emailVerified": "2026-11-10T22:46:54.423Z"
  },
  {
    "name": "Eryn Heathcote",
    "email": "test45@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/96.jpg",
    "emailVerified": "2026-11-11T00:58:35.901Z"
  },
  {
    "name": "Celestino Homenick",
    "email": "test46@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/63913516",
    "emailVerified": "2026-11-10T17:29:15.215Z"
  },
  {
    "name": "Larue Gutmann",
    "email": "test47@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/16.jpg",
    "emailVerified": "2026-11-11T03:08:41.411Z"
  },
  {
    "name": "Troy Stiedemann",
    "email": "test48@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/7.jpg",
    "emailVerified": "2026-11-10T22:50:29.547Z"
  },
  {
    "name": "Janelle Nolan",
    "email": "test49@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/7.jpg",
    "emailVerified": "2026-11-10T19:07:55.294Z"
  },
  {
    "name": "Alice Krajcik",
    "email": "test50@example.com",
    "password_hash": "$2b$10$y4yB.4g.P1ONGONWj9ifz.ovuqivJWbkKF2NJBefklaJGDg6n1RZS",
    "image": "https://avatars.githubusercontent.com/u/41682017",
    "emailVerified": "2026-11-10T10:57:02.269Z"
  }
];

async function main() {
  console.log('Seeding database with 50 users...');
  
  // Clean existing data
  console.log('Clearing existing data...');
  await prisma.bid.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // Insert 50 users
  for (const user of usersData) {
    await prisma.user.create({
      data: {
        ...user,
        emailVerified: new Date(user.emailVerified)
      }
    });
  }

  console.log('Successfully created ' + usersData.length + ' users!');
  console.log('Credentials: test1@example.com to test50@example.com (Password: password123)');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
