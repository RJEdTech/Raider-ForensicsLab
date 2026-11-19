/* Where science meets philosophy + How exact does it need to be? (Nov 19, 2026; follows the BioLab/PhysLab pilot of Nov 17)
   One entry per tool. Rendered by the engine below the stage in Full lab and at the end of Learn it.
   Standard: teach, don't preach. Name each thinker's view fairly, state definitive Church teaching as the Church's teaching,
   and leave open questions open (no answer key). Every number has a source and a year. */
BioLab.addBorder({
fingerprints: {
  q: 'Can a fingerprint make us certain who did it?',
  saw: 'A hidden print appeared, and you compared its ridge details with the suspects’ prints. A match is a judgment made by a person comparing patterns, not a reading on a meter.',
  assumes: [
    'No two fingers leave the same pattern. Millions of comparisons support this, but no one has checked every finger.',
    'Every contact leaves a trace (Locard’s principle), and the trace can be read later.',
    'The examiner sees what is in the print, not what the case file says should be there.'
  ],
  stops: 'Science can say how strong the evidence is and how often examiners get it wrong. Whether a person is guilty is a judgment made by people (a jury, a judge) weighing all of the evidence. A match puts someone’s finger on the glass. It does not say when, why, or what they meant to do.',
  church: 'The Church teaches that every person has a right to their good name: judging someone guilty without enough evidence is the sin of rash judgment (Catechism nos. 2477–2478). The Catechism quotes St. Ignatius of Loyola’s rule from the <i>Spiritual Exercises</i>: be readier to put a good interpretation on what someone says than to condemn it. A careful examiner and an honest jury serve the truth, and the truth serves the person.',
  faith: { items: [
    { who: 'Marcello Malpighi', when: 'professor at Bologna and physician to Pope Innocent XII, 1686', says: 'Studying skin under one of the first microscopes, he described the ridges, loops and spirals on fingertips, the patterns examiners still compare today.' },
    { who: 'St. Ivo of Kermartin', when: 'priest and judge in Brittany, 1200s; patron saint of lawyers', says: 'Known as the “advocate of the poor,” he took the cases of people who could not pay and was famous for judging fairly, without favoring the powerful.' }
  ] },
  views: [
    { who: 'Edmond Locard', when: 'French forensic scientist, 1920s', says: 'Every contact leaves a trace. Evidence read patiently can show what happened when no one else saw.' },
    { who: 'William Blackstone', when: 'English judge, 1769', says: 'Better that ten guilty people go free than that one innocent person suffer. The law should demand strong proof before it condemns.' },
    { who: 'David Hume', when: '1748', says: 'No number of past matches can prove the next one. Every conclusion from evidence rests on experience, so it is probable, never certain.' },
    { who: 'Thomas Bayes', when: 'published 1763', says: 'Evidence makes a claim more or less likely. A good judge updates step by step, starting from how likely the claim was before the evidence came in.' },
    { who: 'Thomas Aquinas', when: '13th century', says: 'In human affairs we cannot have the certainty of mathematics. We can have enough certainty to act justly, if we judge carefully and fairly.' }
  ],
  margin: {
    lead: 'Fingerprint evidence is strong, but its error rate is not zero, and it depends on how you measure it.',
    rows: [
      { what: 'False matches, FBI black-box study (2011)', value: 'About 0.1% of comparisons', range: 'Could be as high as 1 in 306 cases (PCAST, 2016)', how: '169 examiners made about 17,000 comparisons without knowing the right answers (Ulery et al., 2011)', enough: 'Showing that print evidence is strong, but not perfect.' },
      { what: 'Missed matches, same study', value: 'About 7.5% of true pairs', range: 'A second, independent examiner caught most of them', how: 'Same study, same examiners', enough: 'Seeing why labs have a second examiner check the work.' },
      { what: 'False matches, Miami-Dade study (2014)', value: 'About 3%', range: 'Could be as high as 1 in 18 cases (PCAST, 2016)', how: 'Examiners at one police lab, tested on realistic casework prints', enough: 'Showing that error rates depend on how they are measured.' }
    ],
    note: 'In 2004 the FBI wrongly matched a print from the Madrid train bombing to an Oregon lawyer, Brandon Mayfield, and several examiners agreed. Spanish police found the true source. A range is a reason for humility, not for giving up on evidence.'
  }
}
});
