export type ParentStatus = "active" | "pending";

export type Parent = {
  id: string;
  name: string;
  relationship: "mamá" | "papá" | "tutor";
  status: ParentStatus;
};

export type Kid = {
  id: string;
  name: string;
  birthDate: string; // ISO 8601, solo fecha: YYYY-MM-DD
  joinedAt: string; // ISO 8601, solo fecha: YYYY-MM-DD
  room: "Soles" | "Lunas";
  initials: string;
  avatarTone: "sky" | "rose" | "mint" | "sun" | "lilac";
  allergies?: string;
  medicalNotes?: string;
  parents: Parent[];
};

export const kids: Kid[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    birthDate: "2023-03-12",
    joinedAt: "2025-02-03",
    room: "Soles",
    initials: "M",
    avatarTone: "sky",
    allergies:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        id: "lucia-fernandez",
        name: "Lucía Fernández",
        relationship: "mamá",
        status: "active",
      },
      {
        id: "diego-fernandez",
        name: "Diego Fernández",
        relationship: "papá",
        status: "pending",
      },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    birthDate: "2024-01-22",
    joinedAt: "2025-03-10",
    room: "Soles",
    initials: "S",
    avatarTone: "rose",
    parents: [
      {
        id: "mariana-mendez",
        name: "Mariana Méndez",
        relationship: "mamá",
        status: "active",
      },
    ],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    birthDate: "2023-06-28",
    joinedAt: "2024-08-19",
    room: "Soles",
    initials: "B",
    avatarTone: "mint",
    parents: [
      {
        id: "paula-ruiz",
        name: "Paula Ruiz",
        relationship: "mamá",
        status: "active",
      },
      {
        id: "martin-ruiz",
        name: "Martín Ruiz",
        relationship: "papá",
        status: "active",
      },
    ],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    birthDate: "2024-04-18",
    joinedAt: "2025-06-02",
    room: "Soles",
    initials: "V",
    avatarTone: "sun",
    parents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    birthDate: "2023-01-30",
    joinedAt: "2024-09-12",
    room: "Soles",
    initials: "T",
    avatarTone: "lilac",
    allergies: "Intolerancia a la lactosa.",
    parents: [
      {
        id: "andres-diaz",
        name: "Andrés Díaz",
        relationship: "papá",
        status: "active",
      },
    ],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    birthDate: "2024-07-09",
    joinedAt: "2025-07-21",
    room: "Soles",
    initials: "E",
    avatarTone: "rose",
    parents: [
      {
        id: "julieta-castro",
        name: "Julieta Castro",
        relationship: "mamá",
        status: "active",
      },
    ],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    birthDate: "2023-09-05",
    joinedAt: "2024-03-05",
    room: "Soles",
    initials: "L",
    avatarTone: "sky",
    parents: [
      {
        id: "nicolas-romero",
        name: "Nicolás Romero",
        relationship: "papá",
        status: "active",
      },
    ],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    birthDate: "2024-09-14",
    joinedAt: "2025-08-04",
    room: "Soles",
    initials: "O",
    avatarTone: "mint",
    parents: [
      {
        id: "camila-vega",
        name: "Camila Vega",
        relationship: "mamá",
        status: "active",
      },
    ],
  },
];

export function getKidById(id: string): Kid | undefined {
  return kids.find((kid) => kid.id === id);
}
