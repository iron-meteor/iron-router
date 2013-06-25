function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1, str.length);
}

function classify (str) {
  var re = /_|-|\./;
  return _.map(str.split(re), function (word) {
    return capitalize(word);
  });
}

var root = this;

ServerRouter = IronRouter.extends({
  //XXX Finish server side
});
