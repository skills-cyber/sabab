import React from 'react';
import { UnderlineTabs } from '../common/UnderlineTabs';
import { useApp } from '../../contexts/AppContext';

/** Students module tabs: directory, families, year-end promotion. */
export function StudentsNav() {
  const { role } = useApp();
  const showPromotion = role === 'owner' || role === 'principal' || role === 'coordinator' || role === 'office';
  return (
    <UnderlineTabs
      layoutId="students-tabs"
      tabs={[
      { id: 'list', label: 'Students', to: '/students' },
      ...(role !== 'teacher' ? [{ id: 'families', label: 'Families', to: '/students/families' }] : []),
      ...(showPromotion ? [{ id: 'promotion', label: 'Promotion', to: '/students/promotion' }] : [])]
      } />);


}