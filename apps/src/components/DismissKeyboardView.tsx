import React from "react";
import { TouchableWithoutFeedback, Keyboard, View, StyleProp, ViewStyle } from "react-native";

// Wraps a screen in the keyboard-dismiss touchable. Props stay open (screens
// pass container styles through), typed as View's own style contract.
const DismissKeyboardHOC = (
  Comp: React.ComponentType<{ style?: StyleProp<ViewStyle>; children?: React.ReactNode }>
) => {
  return ({ children, ...props }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Comp {...props}>{children}</Comp>
    </TouchableWithoutFeedback>
  );
};

export const DismissKeyboardView = DismissKeyboardHOC(View);
