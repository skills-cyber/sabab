export interface LearningMaterial {
  id: string;
  sectionId: string;
  subjectId: string;
  title: string;
  kind: 'PDF' | 'Video' | 'Link' | 'Slides' | 'Worksheet';
  topic: string;
  uploadedBy: string;
  uploadedOn: string;
  views: number;
}

export const materials: LearningMaterial[] = [
{ id: 'MT-201', sectionId: '8A', subjectId: 'MATH', title: 'Circle theorems — worked examples', kind: 'PDF', topic: '10.1 Parts of a circle', uploadedBy: 'Farhana Rahman', uploadedOn: '2026-11-01', views: 34 },
{ id: 'MT-200', sectionId: '8A', subjectId: 'MATH', title: 'Chord & arc video lesson (8 min)', kind: 'Video', topic: '10.2 Chords and arcs', uploadedBy: 'Farhana Rahman', uploadedOn: '2026-10-29', views: 51 },
{ id: 'MT-198', sectionId: '8B', subjectId: 'MATH', title: 'Algebraic factorisation worksheet', kind: 'Worksheet', topic: '9.3 Factorisation', uploadedBy: 'Farhana Rahman', uploadedOn: '2026-10-27', views: 22 },
{ id: 'MT-195', sectionId: '9A', subjectId: 'HMATH', title: 'Sets & functions slides', kind: 'Slides', topic: '1.2 Functions', uploadedBy: 'Farhana Rahman', uploadedOn: '2026-10-22', views: 40 },
{ id: 'MT-190', sectionId: '8A', subjectId: 'SCI', title: 'Photosynthesis interactive (PhET)', kind: 'Link', topic: '6.1 Plant processes', uploadedBy: 'Nusrat Jahan', uploadedOn: '2026-10-20', views: 63 },
{ id: 'MT-188', sectionId: '8A', subjectId: 'ENG', title: 'Paragraph writing rubric', kind: 'PDF', topic: 'Writing · paragraph', uploadedBy: 'Sabrina Chowdhury', uploadedOn: '2026-10-18', views: 29 }];