/**
 * Mock patient data for मातृत्व AI demo.
 * All patients belong to ASHA worker "asha_001".
 *
 * category: 'safe' | 'monitor' | 'elevated' | 'critical'
 * visitedThisWeek: true if a checkup was recorded in the past 7 days
 */
const mockPatients = [
  {
    id: 'p001',
    name: 'Priya Sharma',
    age: 26,
    gestationWeek: 32,
    riskScore: 88,
    category: 'critical',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: true,
  },
  {
    id: 'p002',
    name: 'Anita Devi',
    age: 22,
    gestationWeek: 28,
    riskScore: 71,
    category: 'elevated',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: true,
  },
  {
    id: 'p003',
    name: 'Sunita Yadav',
    age: 30,
    gestationWeek: 20,
    riskScore: 65,
    category: 'elevated',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: false,
  },
  {
    id: 'p004',
    name: 'Meena Kumari',
    age: 24,
    gestationWeek: 16,
    riskScore: 48,
    category: 'monitor',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: true,
  },
  {
    id: 'p005',
    name: 'Kavita Singh',
    age: 28,
    gestationWeek: 36,
    riskScore: 42,
    category: 'monitor',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: false,
  },
  {
    id: 'p006',
    name: 'Rekha Patel',
    age: 25,
    gestationWeek: 24,
    riskScore: 22,
    category: 'safe',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: true,
  },
  {
    id: 'p007',
    name: 'Geeta Verma',
    age: 21,
    gestationWeek: 12,
    riskScore: 18,
    category: 'safe',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: false,
  },
  {
    id: 'p008',
    name: 'Pooja Mishra',
    age: 29,
    gestationWeek: 30,
    riskScore: 15,
    category: 'safe',
    ashaWorkerId: 'asha_001',
    visitedThisWeek: false,
  },
];

export default mockPatients;
