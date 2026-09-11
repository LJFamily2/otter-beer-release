import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsBlogSection } from "@/components/sections/NewsBlogSection";
import type { NewsCardItem } from "@/lib/utils/BlogPostPresenter";

/** jsdom implements no scrolling — the rail only needs the call to be observable. */
function mockRailScrolling() {
  const scrollBy = jest.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollBy", {
    value: scrollBy,
    writable: true,
    configurable: true,
  });
  return scrollBy;
}

function viPosts(): NewsCardItem[] {
  return [
    {
      id: "1",
      imageSrc: "/api/media/public/news-blog/1.jpg",
      title: "Nhật Ký Nhà Nấu",
      tag: "HẬU TRƯỜNG",
      href: "/blog/nhat-ky-nha-nau",
    },
    {
      id: "2",
      imageSrc: "/api/media/public/news-blog/2.jpg",
      title: "Đêm Bên Bờ Biển",
      tag: "SỰ KIỆN",
      href: "/blog/dem-ben-bo-bien",
    },
    {
      id: "3",
      imageSrc: "/api/media/public/news-blog/3.jpg",
      title: "Hoa Bia Xứ Tây Ninh",
      tag: "NGUYÊN LIỆU",
      href: "/blog/hoa-bia-xu-tay-ninh",
    },
    {
      id: "4",
      imageSrc: "/api/media/public/news-blog/4.jpg",
      title: "Rót Một Ly Vàng Óng",
      tag: "SẢN PHẨM",
      href: "/blog/rot-mot-ly-vang-ong",
    },
    {
      id: "5",
      imageSrc: "/api/media/public/news-blog/5.jpg",
      title: "Cộng Đồng Thủ Công",
      tag: "CON NGƯỜI",
      href: "/blog/cong-dong-thu-cong",
    },
  ];
}

function enPosts(): NewsCardItem[] {
  return [
    {
      id: "1",
      imageSrc: "/api/media/public/news-blog/1.jpg",
      title: "Brewhouse Diary",
      tag: "BEHIND THE SCENES",
      href: "/en/blog/brewhouse-diary",
    },
    {
      id: "2",
      imageSrc: "/api/media/public/news-blog/2.jpg",
      title: "Hops of Tay Ninh",
      tag: "INGREDIENTS",
      href: "/en/blog/hops-of-tay-ninh",
    },
  ];
}

describe("NewsBlogSection Component", () => {
  it("renders the English masthead and story cards", () => {
    render(<NewsBlogSection locale="en" posts={enPosts()} />);

    expect(
      screen.getByRole("heading", { name: /otter beer journal/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/news & blog/i)).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /brewhouse diary/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /hops of tay ninh/i })
    ).toBeInTheDocument();
    expect(screen.getByText("BEHIND THE SCENES")).toBeInTheDocument();
  });

  it("renders Vietnamese copy and tags when locale is 'vi'", () => {
    render(<NewsBlogSection locale="vi" posts={viPosts()} />);

    expect(
      screen.getByRole("heading", { name: /nhật ký bia chú rái cá/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /nhật ký nhà nấu/i })
    ).toBeInTheDocument();
    expect(screen.getByText("HẬU TRƯỜNG")).toBeInTheDocument();
  });

  it("links every card to its own post and the view-all CTA to the blog, locale-prefixed", () => {
    const { unmount } = render(<NewsBlogSection locale="vi" posts={viPosts()} />);

    // vi is the default locale, so the view-all CTA carries no URL prefix,
    // and each card links straight to its post's real slug.
    expect(screen.getByRole("link", { name: /nhật ký nhà nấu/i })).toHaveAttribute(
      "href",
      "/blog/nhat-ky-nha-nau"
    );
    expect(
      screen.getByRole("link", { name: /xem tất cả bài viết/i })
    ).toHaveAttribute("href", "/blog");

    unmount();
    render(<NewsBlogSection locale="en" posts={enPosts()} />);

    expect(screen.getByRole("link", { name: /brewhouse diary/i })).toHaveAttribute(
      "href",
      "/en/blog/brewhouse-diary"
    );
  });

  it("omits the tag pill for a post with no tag", () => {
    const { container } = render(
      <NewsBlogSection
        locale="en"
        posts={[
          {
            id: "1",
            imageSrc: "/api/media/public/news-blog/1.jpg",
            title: "Untitled Story",
            href: "/en/blog/untitled-story",
          },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: /untitled story/i })).toBeInTheDocument();
    expect(container.querySelector("[data-news-card] span")).not.toBeInTheDocument();
  });

  it("scrolls the rail forward by one card when the next arrow is clicked", async () => {
    const scrollBy = mockRailScrolling();
    render(<NewsBlogSection locale="en" posts={enPosts()} />);

    await userEvent.click(
      screen.getByRole("button", { name: /next story/i })
    );

    expect(scrollBy).toHaveBeenCalledTimes(1);
    const [{ left }] = scrollBy.mock.calls[0] as [{ left: number }];
    expect(left).toBeGreaterThanOrEqual(0);
  });

  it("disables the previous arrow while the rail sits at its start", () => {
    mockRailScrolling();
    render(<NewsBlogSection locale="en" posts={enPosts()} />);

    expect(screen.getByRole("button", { name: /previous story/i })).toBeDisabled();
  });

  it("exposes the rail as a labelled, keyboard-reachable region", () => {
    const posts = viPosts();
    render(<NewsBlogSection locale="en" posts={posts} />);

    const rail = screen.getByRole("region", { name: /featured stories carousel/i });
    expect(rail).toHaveAttribute("tabindex", "0");
    expect(within(rail).getAllByRole("link")).toHaveLength(posts.length);
  });
});
