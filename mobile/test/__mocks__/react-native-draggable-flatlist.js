const React = require('react');

function DraggableFlatList(props) {
  const { data = [], renderItem, keyExtractor } = props;
  return React.createElement(
    'FlatList',
    {
      data,
      renderItem,
      keyExtractor: keyExtractor || ((item, index) => String(index)),
    },
    null
  );
}

module.exports = DraggableFlatList;


