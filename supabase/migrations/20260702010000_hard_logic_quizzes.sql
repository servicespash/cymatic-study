-- Cymatic Hub - Advanced Logic & Systems Evaluation Seed (Fixed UUID Mapping)
-- Explicitly invokes gen_random_uuid() to bypass strict table constraints

INSERT INTO public.quiz_questions (id, topic_id, question, options, correct_index, explanation)
VALUES 
(
  gen_random_uuid(),
  'b1-1',
  'If a metabolic inhibitor completely blocks the function of the rough endoplasmic reticulum, which cellular metric drops first on the monitoring chart?',
  ARRAY[
    'Adenosine triphosphate (ATP) synthesis rates',
    'Post-translational modification and folding of secretable proteins',
    'Unidirectional translocation of sodium-potassium active pumps',
    'Lipid and steroid hormone macromolecule assembly'
  ],
  1,
  'The rough endoplasmic reticulum is structurally studded with ribosomes and specializes in the synthesis and folding of proteins destined for secretion or membranes.'
),
(
  gen_random_uuid(),
  'b1-4',
  'A sample of chyme exiting the pyloric sphincter shows a completely unneutralized acidic pH. Which biochemical signal failed to execute in the duodenum?',
  ARRAY[
    'Amylase secretion from the salivary glands',
    'Secretin stimulation of pancreatic bicarbonate ions',
    'Pepsinogen activation within the gastric pits',
    'Bile salt emulsification of lipids in the ileum'
  ],
  1,
  'Secretin is triggered by acidic chyme entering the duodenum; it signals the pancreas to release bicarbonate ions to neutralize the acid. Failure results in a highly acidic state.'
)
ON CONFLICT (id) DO NOTHING;
