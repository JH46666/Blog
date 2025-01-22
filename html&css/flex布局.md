列还是行?
弹性盒子提供了 flex-direction 这样一个属性，它可以指定主轴的方向（弹性盒子子类放置的地方）— 它默认值是 row，这使得它们在按你浏览器的默认语言方向排成一排（在英语/中文浏览器中是从左到右）。

flex-direction: column;

换行
flex-wrap: wrap

flex-flow 缩写
到这里，应当注意到存在着 flex-direction 和 flex-wrap — 的缩写 flex-flow。比如，你可以将

flex-direction: row;
flex-wrap: wrap;
替换为

flex-flow: row wrap;

article {
flex: 1;
}

是一个无单位的比例值，表示每个 flex 项沿主轴的可用空间大小。本例中，我们设置 <article> 元素的 flex 值为 1，这表示每个元素占用空间都是相等的，占用的空间是在设置 padding 和 margin 之后剩余的空间。因为它是一个比例，这意味着将每个 flex 项的设置为 400000 的效果和 1 的时候是完全一样的。

flex: 缩写与全写
flex 是一个可以指定最多三个不同值的缩写属性：

第一个就是上面所讨论过的无单位比例。可以单独指定全写 flex-grow 属性的值。
第二个无单位比例 — flex-shrink — 一般用于溢出容器的 flex 项。这指定了从每个 flex 项中取出多少溢出量，以阻止它们溢出它们的容器。 这是一个相当高级的弹性盒子功能，我们不会在本文中进一步说明。
第三个是上面讨论的最小值。可以单独指定全写 flex-basis 属性的值。

flex-shrink 属性指定了 flex 元素的**收缩**规则。flex 元素仅在默认宽度之和大于容器的时候才会发生收缩，其收缩的大小是依据 flex-shrink 的值。

flex-grow 设置了一个 flex 项主尺寸的 flex**增长**系数。它指定了 flex 容器中剩余空间的多少应该分配给项目（flex 增长系数）。

主尺寸是项的宽度或高度，这取决于 flex-direction 值。

剩余的空间是 flex 容器的大小减去所有 flex 项的大小加起来的大小。

![flex-grow布局](./0081Kckwgy1gkk4oebj3fj30wh0u0jt7.webp)
