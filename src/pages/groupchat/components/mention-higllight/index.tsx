const highlightStyle = {
  color: "rgb(65,58,255)",
  fontWeight: "bold",
};

export const highlightMentions = (text: string) => {
  let parts = [];
  let i = 0;
  while (text.length > 0) {
    const mentionMatchResult = text.match(/@([\w\u4e00-\u9fa5])+/m);
    let index = mentionMatchResult?.index;
    if (index === undefined) {
      index = -1;
    }
    if (!mentionMatchResult || index === -1) {
      // parts.push(new Part(PartType.text, text))
      parts.push(text);
      break;
    }
    if (index > 0) {
      // parts.push(new Part(PartType.text, text.substring(0, index)));
      parts.push(text.substring(0, index));
    }
    // let data = {};
    // if (i < mention.uids.length) {
    //   data = { uid: mention.uids[i] };
    // }

    // parts.push(new Part(PartType.mention, text.substr(index, mentionMatchResult[0].length),data))
    parts.push(text.substr(index, mentionMatchResult[0].length));
    text = text.substring(index + mentionMatchResult[0].length);

    i++;
  }

  return parts;
//   return parts.map((part, index) => {
//     const match = part.match(/@(\w\u4e00-\u9fa5+)$/);
//     if (match) {
    
//       return <span style={highlightStyle}>{match}</span>;
//     }
//     return part;
//   });
};

const HighlightMentions = (props: { text: string }) => {
  return <>{highlightMentions(props.text)}</>;
};

export default HighlightMentions;
