import React, { ChangeEvent } from 'react';
import Styled from './styled';

type Props = {
  className?: string;
  checked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

const Checkbox = ({ className, checked, onChange }: Props) => (
  <Styled.CheckboxContainer className={className}>
    <Styled.HiddenCheckbox
      defaultChecked={checked}
      onChange={onChange}
      data-testid="hidden-checkbox"
    />
    <Styled.Checkbox checked={checked} data-testid="checkbox-icon">
      <Styled.Icon viewBox="0 0 24 24" data-testid="checkbox-icon-svg">
        <polyline points="20 6 9 17 4 12" />
      </Styled.Icon>
    </Styled.Checkbox>
  </Styled.CheckboxContainer>
);

export default Checkbox;
