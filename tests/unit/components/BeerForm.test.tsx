import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BeerForm } from "@/app/(admin)/admin/(protected)/beers/BeerForm";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: mockRefresh }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockRefresh.mockClear();
});

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/dòng bia/i), {
    target: { value: "Premium Lager" },
  });
  fireEvent.change(screen.getByLabelText(/tiêu đề/i), {
    target: { value: "Headline" },
  });
  fireEvent.change(screen.getByLabelText(/mô tả/i), {
    target: { value: "Description" },
  });
  fireEvent.change(screen.getByLabelText(/abv/i), { target: { value: "4.5" } });
  fireEvent.change(screen.getByLabelText(/^ibu$/i), { target: { value: "20" } });
}

function mockFetchOk() {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ _id: "beer-1" }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("BeerForm theme color fields", () => {
  it("defaults the color swatches to the brand colors when no value is set", () => {
    render(<BeerForm mode="create" />);

    const primarySwatch = screen.getByLabelText(/chọn màu chính/i) as HTMLInputElement;
    const containerSwatch = screen.getByLabelText(/chọn màu nền/i) as HTMLInputElement;

    expect(primarySwatch.value.toLowerCase()).toBe("#002867");
    expect(containerSwatch.value.toLowerCase()).toBe("#1d3f82");
  });

  it("syncs the swatch with a valid hex typed into the text field", () => {
    render(<BeerForm mode="create" />);

    const hexInput = screen.getByLabelText(/^màu chính/i) as HTMLInputElement;
    const swatch = screen.getByLabelText(/chọn màu chính/i) as HTMLInputElement;

    fireEvent.change(hexInput, { target: { value: "#123abc" } });
    expect(swatch.value.toLowerCase()).toBe("#123abc");

    fireEvent.change(hexInput, { target: { value: "not-a-color" } });
    expect(swatch.value.toLowerCase()).toBe("#002867");
  });

  it("rejects an invalid hex color on submit without calling the API", async () => {
    const fetchMock = mockFetchOk();
    render(<BeerForm mode="create" />);
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText(/^màu chính/i), {
      target: { value: "not-a-hex" },
    });
    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => {
      expect(screen.getByText(/mã hex không hợp lệ/i)).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits themeColor/themeColorContainer when both are filled in", async () => {
    const fetchMock = mockFetchOk();
    render(<BeerForm mode="create" />);
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText(/^màu chính/i), {
      target: { value: "#123abc" },
    });
    fireEvent.change(screen.getByLabelText(/^màu nền/i), {
      target: { value: "#654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.themeColor).toBe("#123abc");
    expect(body.themeColorContainer).toBe("#654321");
  });

  it("omits theme colors from the payload when left blank", async () => {
    const fetchMock = mockFetchOk();
    render(<BeerForm mode="create" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.themeColor).toBeUndefined();
    expect(body.themeColorContainer).toBeUndefined();
  });

  it("pre-fills theme colors from initialData when editing", () => {
    render(
      <BeerForm
        mode="edit"
        beerId="beer-1"
        initialData={{
          abv: 4.3,
          ibu: 20,
          isFeatured: false,
          status: "published",
          themeColor: "#b22a2a",
          themeColorContainer: "#8b1f1f",
          translations: {
            vi: { style: "Bia", headline: "Tiêu đề", description: "Mô tả" },
          },
        }}
      />
    );

    expect(screen.getByLabelText(/^màu chính/i)).toHaveValue("#b22a2a");
    expect(screen.getByLabelText(/^màu nền/i)).toHaveValue("#8b1f1f");
  });
});

/** The main image's own label input (the first pill), by its stable id. */
function mainNameInput(locale = "vi") {
  return document.getElementById(`main-image-name-${locale}`) as HTMLInputElement | null;
}

/** A variant row's label input, by row index. */
function variantNameInput(index: number, locale = "vi") {
  return document.getElementById(`variant-${index}-name-${locale}`) as HTMLInputElement;
}

describe("BeerForm product variants", () => {
  it("starts with no variants and an empty-state message", () => {
    render(<BeerForm mode="create" />);

    expect(screen.getByText(/chưa có phiên bản nào/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/tên ngắn \(tiếng việt\)/i)).not.toBeInTheDocument();
  });

  it("adds a variant row with one short-name input per language", () => {
    render(<BeerForm mode="create" />);

    fireEvent.click(screen.getByRole("button", { name: /thêm phiên bản/i }));

    expect(variantNameInput(0)).toBeInTheDocument();
    expect(variantNameInput(0, "en")).toBeInTheDocument();
    expect(screen.queryByText(/chưa có phiên bản nào/i)).not.toBeInTheDocument();
  });

  it("reveals the main image's own label row only once a variant exists", () => {
    render(<BeerForm mode="create" />);

    expect(mainNameInput()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /thêm phiên bản/i }));

    expect(mainNameInput()).toBeInTheDocument();
  });

  it("removes the right variant row", () => {
    render(<BeerForm mode="create" />);

    fireEvent.click(screen.getByRole("button", { name: /thêm phiên bản/i }));
    fireEvent.change(variantNameInput(0), { target: { value: "LON" } });
    fireEvent.click(screen.getByRole("button", { name: /thêm phiên bản/i }));

    expect(variantNameInput(0).value).toBe("LON");
    expect(variantNameInput(1).value).toBe("");

    fireEvent.click(screen.getAllByRole("button", { name: /^xóa$/i })[0]);

    expect(variantNameInput(1)).not.toBeInTheDocument();
    expect(variantNameInput(0).value).toBe("");
  });

  it("blocks submit when a variant has no image, without calling the API", async () => {
    const fetchMock = mockFetchOk();
    render(<BeerForm mode="create" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /thêm phiên bản/i }));
    fireEvent.change(variantNameInput(0), { target: { value: "LON" } });
    fireEvent.change(mainNameInput()!, { target: { value: "CHAI" } });
    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => {
      expect(screen.getByText(/phiên bản 1: cần tải ảnh/i)).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks submit when a variant is missing its Vietnamese label", async () => {
    const fetchMock = mockFetchOk();
    render(<BeerForm mode="create" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /thêm phiên bản/i }));
    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => {
      expect(screen.getByText(/phiên bản 1: cần nhập tên \(tiếng việt\)/i)).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hydrates the main label + variants and sends them back on submit", async () => {
    const fetchMock = mockFetchOk();
    render(
      <BeerForm
        mode="edit"
        beerId="beer-1"
        initialData={{
          abv: 4.3,
          ibu: 20,
          isFeatured: false,
          status: "draft",
          imageKey: "beers/main.png",
          imageNames: { vi: "LON", en: "CAN" },
          translations: {
            vi: { style: "Lager", headline: "H", description: "D" },
          },
          variants: [
            { imageKey: "beers/six.png", names: { vi: "BAO BÌ 6 LON" } },
          ],
        }}
      />
    );

    expect(mainNameInput()!.value).toBe("LON");
    expect(mainNameInput("en")!.value).toBe("CAN");
    expect(variantNameInput(0).value).toBe("BAO BÌ 6 LON");

    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.imageNames).toEqual([
      { locale: "vi", shortName: "LON" },
      { locale: "en", shortName: "CAN" },
    ]);
    // The EN label was left blank, so it is omitted rather than sent empty.
    expect(body.variants).toEqual([
      { imageKey: "beers/six.png", names: [{ locale: "vi", shortName: "BAO BÌ 6 LON" }] },
    ]);
  });

  it("blocks submit when variants exist but the main image has no label", async () => {
    const fetchMock = mockFetchOk();
    render(<BeerForm mode="create" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /thêm phiên bản/i }));
    fireEvent.change(variantNameInput(0), { target: { value: "6 LON" } });
    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Ảnh chính: cần nhập tên ngắn/i)
      ).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("BeerForm save behaviour", () => {
  const editInitialData = {
    abv: 4.3,
    ibu: 20,
    isFeatured: false,
    status: "draft" as const,
    imageKey: "beers/main.png",
    translations: {
      vi: { style: "Lager", headline: "H", description: "D" },
    },
  };

  it("stays on the edit page and confirms the save instead of redirecting", async () => {
    mockFetchOk();
    render(<BeerForm mode="edit" beerId="beer-1" initialData={editInitialData} />);

    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => {
      expect(screen.getByText(/đã lưu thay đổi/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("clears the saved banner as soon as the editor changes something", async () => {
    mockFetchOk();
    render(<BeerForm mode="edit" beerId="beer-1" initialData={editInitialData} />);

    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));
    await waitFor(() => expect(screen.getByText(/đã lưu thay đổi/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/^ibu$/i), { target: { value: "25" } });

    expect(screen.queryByText(/đã lưu thay đổi/i)).not.toBeInTheDocument();
  });

  it("hands a newly created product over to its own edit page", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ _id: "new-beer-9" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<BeerForm mode="create" />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin/beers/new-beer-9/sua");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("falls back to the list page when the create response carries no id", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<BeerForm mode="create" />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /lưu sản phẩm/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin/beers"));
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
