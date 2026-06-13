-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_documents table to store filled templates
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  document_number TEXT,
  revision_number TEXT,
  document_data JSONB NOT NULL,
  pdf_url TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on document_templates" ON document_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on generated_documents" ON generated_documents FOR ALL USING (true);

-- Insert the quality control template
INSERT INTO document_templates (name, description, template_type, template_data) VALUES (
  'Kvalitātes kontroles akts (KKA)',
  'Quality Control Act for EL cable tray construction',
  'quality_control',
  '{
    "documentNumber": "EL-04",
    "revision": "01",
    "title": "Kvalitātes kontroles akts (KKA)",
    "subtitle": "EL kabeļu trepju izbūve",
    "fields": {
      "object": { "label": "Objekts", "type": "text", "required": true },
      "contractor": { "label": "Izpildītājs", "type": "text", "required": true },
      "date": { "label": "Datums", "type": "date", "required": true },
      "inspectionNumber": { "label": "Pārbaudes Nr", "type": "text", "required": true },
      "inspectionObject": { "label": "Pārbaudāmais objekts", "type": "text", "required": true },
      "reportNumber": { "label": "Rasējuma nr", "type": "text", "required": false }
    },
    "inspectionItems": [
      {
        "number": "1",
        "description": "Pārbaudes veicēja V.Uzvārds",
        "isHeader": true
      },
      {
        "number": "1.1",
        "description": "Materiālu un iekārtu kvalitāti apliecinošā dokumentācija (BIS vide)",
        "requiresSignature": true
      },
      {
        "number": "1.2",
        "description": "Materiālu kvalitātes (defektu) pārbaude, pēc materiālu izbūves (Vizuāli)",
        "requiresSignature": true
      },
      {
        "number": "1.3",
        "description": "Kabeļu trepju kvalitātes pārbaude (Vizuāli)",
        "requiresSignature": true
      },
      {
        "number": "1.4",
        "description": "Stiprinājumu uzstādīšana kabeļu trečēm pēc projekta",
        "requiresSignature": true,
        "notes": "Izpildshēma Nr. TUK-EL-KT-S01-08"
      },
      {
        "number": "1.5",
        "description": "Kabeļu trepju uzstādīšana pēc projekta",
        "requiresSignature": true,
        "notes": "Izpildshēma Nr. TUK-EL-KT-S01-08"
      },
      {
        "number": "2",
        "description": "Akta pielikumi:",
        "isHeader": true
      },
      {
        "number": "2.1",
        "description": "Izpildshēma: TUK-EL-KT-S01-08",
        "requiresSignature": false
      }
    ],
    "signatures": [
      {
        "role": "Vārds, uzvārds",
        "field": "names"
      },
      {
        "role": "PRO DEV uzraudzošais būvdarbu vadītājs",
        "field": "supervisor",
        "name": "Jānis Indrāns",
        "date": ""
      },
      {
        "role": "Būvdarbu vadītājs",
        "field": "manager",
        "name": "Aleksandrs Kovaļovs",
        "date": ""
      }
    ]
  }'
);
