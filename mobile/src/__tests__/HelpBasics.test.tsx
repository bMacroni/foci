import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HelpProvider } from '../../contexts/HelpContext';
import HelpTarget from '../../components/help/HelpTarget';

const Screen: React.FC = () => {
  return (
    <HelpProvider>
      <HelpTarget helpId="a">
        <></>
      </HelpTarget>
    </HelpProvider>
  );
};

describe('Help basics', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});


