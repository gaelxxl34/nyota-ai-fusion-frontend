/**
 * Program Constants
 * Comprehensive list of all IUEA programs with proper naming (no underscores)
 */

// Complete program options array with proper naming
export const PROGRAM_OPTIONS = [
  // Business and Management Programs
  {
    value: "Bachelor of Business Administration",
    label: "Bachelor of Business Administration",
    level: "bachelor",
    category: "business",
  },
  {
    value: "Bachelor of Public Administration",
    label: "Bachelor of Public Administration",
    level: "bachelor",
    category: "business",
  },
  {
    value: "Bachelor of Procurement and Logistics Management",
    label: "Bachelor of Procurement and Logistics Management",
    level: "bachelor",
    category: "business",
  },
  {
    value: "Bachelor of Tourism and Hotel Management",
    label: "Bachelor of Tourism and Hotel Management",
    level: "bachelor",
    category: "business",
  },
  {
    value: "Bachelor of Human Resource Management",
    label: "Bachelor of Human Resource Management",
    level: "bachelor",
    category: "business",
  },
  {
    value: "Bachelor of Journalism and Communication Studies",
    label: "Bachelor of Journalism and Communication Studies",
    level: "bachelor",
    category: "business",
  },
  {
    value: "Master of Business Administration (MBA)",
    label: "Master of Business Administration (MBA)",
    level: "master",
    category: "business",
  },

  // Science and Technology Programs
  {
    value: "Bachelor of Science in Computer Science",
    label: "Bachelor of Science in Computer Science",
    level: "bachelor",
    category: "technology",
  },
  {
    value: "Bachelor of Information Technology",
    label: "Bachelor of Information Technology",
    level: "bachelor",
    category: "technology",
  },
  {
    value: "Bachelor of Science in Software Engineering",
    label: "Bachelor of Science in Software Engineering",
    level: "bachelor",
    category: "technology",
  },
  {
    value: "Bachelor of Science in Climate Smart Agriculture",
    label: "Bachelor of Science in Climate Smart Agriculture",
    level: "bachelor",
    category: "science",
  },
  {
    value: "Bachelor of Science in Environmental Science and Management",
    label: "Bachelor of Science in Environmental Science and Management",
    level: "bachelor",
    category: "science",
  },
  {
    value: "Master of Information Technology",
    label: "Master of Information Technology",
    level: "master",
    category: "technology",
  },

  // Engineering Programs
  {
    value: "Bachelor of Science in Electrical Engineering",
    label: "Bachelor of Science in Electrical Engineering",
    level: "bachelor",
    category: "engineering",
  },
  {
    value: "Bachelor of Science in Civil Engineering",
    label: "Bachelor of Science in Civil Engineering",
    level: "bachelor",
    category: "engineering",
  },
  {
    value: "Bachelor of Architecture",
    label: "Bachelor of Architecture",
    level: "bachelor",
    category: "engineering",
  },
  {
    value: "Bachelor of Science in Petroleum Engineering",
    label: "Bachelor of Science in Petroleum Engineering",
    level: "bachelor",
    category: "engineering",
  },
  {
    value: "Bachelor of Science in Mechatronics and Robotics",
    label: "Bachelor of Science in Mechatronics and Robotics",
    level: "bachelor",
    category: "engineering",
  },
  {
    value: "Bachelor of Science in Communications Engineering",
    label: "Bachelor of Science in Communications Engineering",
    level: "bachelor",
    category: "engineering",
  },
  {
    value: "Bachelor of Science in Mining Engineering",
    label: "Bachelor of Science in Mining Engineering",
    level: "bachelor",
    category: "engineering",
  },
  {
    value: "Diploma in Electrical Engineering",
    label: "Diploma in Electrical Engineering",
    level: "diploma",
    category: "engineering",
  },
  {
    value: "Diploma in Civil Engineering",
    label: "Diploma in Civil Engineering",
    level: "diploma",
    category: "engineering",
  },
  {
    value: "Diploma in Architecture",
    label: "Diploma in Architecture",
    level: "diploma",
    category: "engineering",
  },

  // Law and Humanities Programs
  {
    value: "Bachelor of Laws (LLB)",
    label: "Bachelor of Laws (LLB)",
    level: "bachelor",
    category: "law",
  },
  {
    value: "Bachelor of International Relations and Diplomatic Studies",
    label: "Bachelor of International Relations and Diplomatic Studies",
    level: "bachelor",
    category: "humanities",
  },
  {
    value: "Master of International Relations and Diplomatic Studies",
    label: "Master of International Relations and Diplomatic Studies",
    level: "master",
    category: "humanities",
  },

  // Certificate Programs
  {
    value: "Higher Education Access Programme - Arts",
    label: "Higher Education Access Programme - Arts",
    level: "certificate",
    category: "arts",
  },
  {
    value: "Higher Education Access Programme - Sciences",
    label: "Higher Education Access Programme - Sciences",
    level: "certificate",
    category: "sciences",
  },
];

// Get program options by level
export const getProgramsByLevel = (level) => {
  return PROGRAM_OPTIONS.filter((program) => program.level === level);
};

// Get program options by category
export const getProgramsByCategory = (category) => {
  return PROGRAM_OPTIONS.filter((program) => program.category === category);
};

// Get program label by value
export const getProgramLabel = (programValue) => {
  const program = PROGRAM_OPTIONS.find((p) => p.value === programValue);
  return program?.label || programValue;
};
