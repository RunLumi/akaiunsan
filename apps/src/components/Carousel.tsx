import React from "react";
import { FlatList, ListRenderItem, StyleProp, ViewStyle } from "react-native";

interface CarouselProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Local banner carousel. Keeping this implementation in the app avoids the
 * legacy snap-carousel package, which reads removed React Native propTypes at
 * module import time.
 */
export default function Carousel<T>({
  data,
  renderItem,
  contentContainerStyle,
}: CarouselProps<T>) {
  return (
    <FlatList
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={data}
      renderItem={renderItem}
      keyExtractor={(_, index) => index.toString()}
      contentContainerStyle={contentContainerStyle}
    />
  );
}
