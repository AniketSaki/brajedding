export interface PollOption {
  id: string;
  label: string;
}

export const site = {
  groom: 'Brajesh',
  partner: 'Saranya',
  venue: 'Guruvayur',
  /** Wedding moment in IST. Change the time here if a muhurtham time is ever known. */
  weddingAt: '2027-02-03T00:00:00+05:30',
  /** Paste the live-stream link here (https://…) to turn the wedding-day banner into a button. */
  streamUrl: '',
  badge: 'Streaming live soon from Guruvayur',
  title: 'Brajesh & Saranya: The Wedding',
  tagline: 'Rated U/A for emotional damage',
  credit: { prefix: 'Brought to you by', name: 'Dating Splinter' },
  farewell: {
    label: 'A message from the management',
    heading: 'Mubi club wishes you a fond farewell',
    body: 'You will be missed.',
  },
  /** Comic shout bubble between BoTD and Stickered. */
  shout: 'employee of the year - Jeff Bezos',
  footer: 'we got brajedding before nadodi subs',
  poll: {
    question: 'Did you get the invite?',
    options: [
      { id: 'physical', label: 'Yes, physical invite hand delivered in person 💌' },
      { id: 'digital', label: 'Only a digital group one 📱' },
      { id: 'thinking', label: "He's thinking about it 🤔" },
      { id: 'gatecrash', label: 'Gatecrash! 🚪💥' },
    ] as PollOption[],
  },
  reactions: {
    words: [
      { id: 'slay', label: 'slay' },
      { id: 'no-cap', label: 'no cap' },
      { id: 'its-giving', label: "it's giving" },
      { id: 'rizz', label: 'rizz' },
      { id: 'ate', label: 'ate' },
      { id: 'based', label: 'based' },
      { id: 'aura', label: 'aura +1000' },
      { id: 'delulu', label: 'delulu' },
      { id: 'mid', label: 'mid' },
      { id: 'cooked', label: 'cooked' },
      { id: 'sus', label: 'sus' },
      { id: 'l', label: 'L' },
    ],
  },
  meta: {
    description: "The countdown to Brajesh & Saranya's wedding. Brought to you by Dating Splinter.",
  },
};
