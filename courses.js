/* Raider ForensicsLab: topic sections and pathways (Forensic Science order from the course's Canvas modules).
   Tool ids that are not built yet are skipped automatically. */
BioLab.setSections({
  units: {},
  extra: { 6: 'Crime scene and evidence', 16: 'Forensic chemistry', 7: 'Biological evidence', 8: 'Trace and impression evidence',
           9: 'Death and forensic anthropology', 18: 'Digital forensics', 20: 'Cybercrime and security', 19: 'Go further' },
  order: [6, 16, 8, 9, 7, 18, 20, 19],
  further: 19,
  unitPrefix: ''
});

BioLab.COURSES = [
  { id: 'forensic', name: 'Forensic Science',
    blurb: 'Tools in the order Forensic Science covers them, ending with digital forensics and a full case to solve.',
    units: [
      { n: 'Unit 1', t: 'What is forensics? The crime scene', ids: ['crimescene'] },
      { n: 'Unit 2', t: 'Fingerprinting', ids: ['fingerprints'] },
      { n: 'Unit 3', t: 'Poisons and toxicology', ids: ['toxicology', 'spottest', 'chromatography', 'spectroscopy'] },
      { n: 'Unit 4', t: 'Death, decomposition and time of death', ids: ['timeofdeath'] },
      { n: 'Unit 5', t: 'Handwriting, questioned documents and trace evidence', ids: ['handwriting', 'hairfiber'] },
      { n: 'Unit 6', t: 'Facial reconstruction and forensic anthropology', ids: ['anthropology'] },
      { n: 'Unit 7', t: 'Blood spatter and DNA', ids: ['bloodspatter', 'dna'] },
      { n: 'Unit 8', t: 'Digital evidence: preserving and examining it', ids: ['hashing', 'filesig', 'metadata', 'recovery'] },
      { n: 'Unit 9', t: 'Cybercrime: how attacks leave clues', ids: ['passwords', 'phishing', 'stego', 'logs'] },
      { n: 'Case', t: 'Digital case file: put it all together', ids: ['casefile'] }
    ],
    further: ['binary', 'internet', 'pubkey', 'firewall', 'risk'],
    furtherLinks: [{ href: 'https://rjedtech.github.io/Raider-ChemLab/#home', title: 'More chemistry in Raider ChemLab', label: 'Raider ChemLab',
      text: 'The chemistry behind the evidence: reactions, solutions, acids and bases, spectroscopy and more.', kind: 'Chemistry' },
      { href: 'https://rjedtech.github.io/Raider-BioLab/#home', title: 'More biology in Raider BioLab', label: 'Raider BioLab',
      text: 'DNA, gel electrophoresis, genetics and the human body.', kind: 'Biology' }] },
  { id: 'cyber', name: 'Explore cybersecurity',
    blurb: 'For any class or any curious student, including AP Computer Science Principles and the AP cyber courses: how data and the internet work, then how systems are attacked, defended and investigated.',
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
  6: ['crimescene'],
  16: ['fingerprints', 'toxicology', 'spottest', 'chromatography', 'spectroscopy'],
  8: ['handwriting', 'hairfiber'],
  9: ['timeofdeath', 'anthropology'],
  7: ['bloodspatter', 'dna'],
  18: ['hashing', 'filesig', 'metadata', 'recovery', 'passwords', 'phishing', 'stego', 'casefile'],
  20: ['binary', 'internet', 'pubkey', 'risk', 'firewall', 'logs']
};
