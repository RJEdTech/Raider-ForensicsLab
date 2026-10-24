/* Raider CyberLab: topic sections and pathways.
   Tool ids that are not built yet are skipped automatically. */
BioLab.setSections({
  units: {},
  extra: { 0: 'Data as bits', 1: 'How the internet works', 2: 'Protecting systems', 3: 'Cryptography', 4: 'Detecting attacks',
           5: 'Protecting yourself', 18: 'Digital forensics', 19: 'Go further' },
  order: [0, 1, 3, 2, 5, 4, 18, 19],
  further: 19,
  unitPrefix: ''
});

BioLab.COURSES = [
  { id: 'forensic', name: 'Forensic Science',
    blurb: 'The digital unit for Forensic Science: how investigators preserve and examine digital evidence, how digital crimes leave clues, and a full case to solve. The chemistry side of Forensic Science lives in <a href="https://rjedtech.github.io/Raider-ChemLab/">Raider ChemLab</a>.',
    units: [
      { n: 'Part 1', t: 'Digital evidence: preserving and examining it', ids: ['hashing', 'filesig', 'metadata', 'recovery'] },
      { n: 'Part 2', t: 'Digital crime: how attacks leave clues', ids: ['passwords', 'phishing', 'stego'] },
      { n: 'Case', t: 'Digital case file: put it all together', ids: ['casefile'] }
    ],
    further: ['logs', 'pubkey', 'binary'] },
  { id: 'explore', name: 'Explore cybersecurity',
    blurb: 'For any class or any curious student, including AP Computer Science Principles and the AP cyber courses: start with how data and the internet work, then how systems are attacked, defended and investigated.',
    units: [
      { n: 'Step 1', t: 'Data is just bits', ids: ['binary', 'filesig'] },
      { n: 'Step 2', t: 'How the internet moves data', ids: ['internet'] },
      { n: 'Step 3', t: 'Keeping secrets', ids: ['pubkey', 'hashing', 'stego'] },
      { n: 'Step 4', t: 'Defending people and systems', ids: ['risk', 'firewall', 'passwords', 'phishing'] },
      { n: 'Step 5', t: 'Catching attackers', ids: ['logs', 'metadata', 'recovery'] },
      { n: 'Step 6', t: 'Put it all together', ids: ['casefile'] }
    ],
    further: [] }
];

BioLab.TOPIC_ORDER = {
  0: ['binary'],
  1: ['internet'],
  2: ['risk', 'firewall'],
  3: ['pubkey'],
  4: ['logs'],
  5: ['passwords', 'phishing'],
  18: ['hashing', 'filesig', 'metadata', 'recovery', 'stego', 'casefile', 'passwords', 'phishing']
};
