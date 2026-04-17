<?php

namespace Amzs\CoreBundle\Service\Datatable;

use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\Query;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\Request;

abstract class BaseDataTable
{
    protected $repository;
    protected $entityAlias = 'e';

    public function __construct(EntityRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Hook chính để module con tùy chỉnh QueryBuilder từ đầu
     * (ví dụ: thêm JOIN, WHERE mặc định, soft delete, chỉ lấy dữ liệu của user hiện tại...)
     */
    protected function createBaseQueryBuilder(): QueryBuilder
    {
        return $this->repository->createQueryBuilder($this->entityAlias);
    }

    /**
     * Hook để thêm các điều kiện WHERE mặc định (luôn áp dụng)
     * Module con override method này để thêm điều kiện cố định.
     */
    protected function applyDefaultFilters(QueryBuilder $qb, Request $request): void
    {
         // tự động áp dụng filter theo ngôn ngữ
         $language = $request->query->get('language');
         if ($language) {
             $qb->andWhere($this->entityAlias . '.language = :language')->setParameter('language', $language);
         }
    }

    /**
     * Hook để thêm filter từ request (language, status, category, user_id...)
     * Module con override để xử lý filter riêng.
     */
    protected function applyCustomFilters(QueryBuilder $qb, Request $request): void
    {
        // child class override
    }

    /**
     * Các field được phép tìm kiếm global (LIKE)
     */
    abstract protected function getSearchableFields(): array;

    /**
     * Map thứ tự cột DataTables → tên field trong entity (dùng để ORDER BY)
     */
    abstract protected function getColumnMap(): array;

    /**
     * Format dữ liệu trả về cho DataTables (array)
     */
    abstract protected function formatData(array $entities): array;

    public function getData(Request $request): array
    {
        $draw        = (int) $request->query->get('draw', 1);
        $start       = (int) $request->query->get('start', 0);
        $length      = (int) $request->query->get('length', 10);
        $searchValue = $request->query->get('search')['value'] ?? '';
        $order       = $request->query->get('order')[0] ?? ['column' => 0, 'dir' => 'asc'];

        // ================== 1. Tạo QueryBuilder cơ bản ==================
        $qb = $this->createBaseQueryBuilder();

        // ================== 2. Áp dụng WHERE mặc định (luôn có) ==================
        $this->applyDefaultFilters($qb, $request);

        // ================== 3. Áp dụng filter tùy chỉnh từ request ==================
        $this->applyCustomFilters($qb, $request);

        // ================== 4. Global Search ==================
        if (!empty($searchValue)) {
            $orX = $qb->expr()->orX();
            foreach ($this->getSearchableFields() as $field) {
                $orX->add($qb->expr()->like($this->entityAlias . '.' . $field, ':search'));
            }
            $qb->andWhere($orX)
                ->setParameter('search', '%' . $searchValue . '%');
        }

        // ================== 5. Đếm tổng (recordsTotal) ==================
        $totalQb = clone $qb;
        $recordsTotal = $totalQb->select('COUNT(' . $this->entityAlias . '.id)')
            ->getQuery()
            ->getSingleScalarResult();

        // ================== 6. Đếm sau khi filter (recordsFiltered) ==================
        $filteredQb = clone $qb;
        $recordsFiltered = $filteredQb->select('COUNT(' . $this->entityAlias . '.id)')
            ->getQuery()
            ->getSingleScalarResult();

        // ================== 7. Order By ==================
        $columnMap = $this->getColumnMap();
        $orderColumnIdx = (int) $order['column'];
        $orderDir = strtoupper($order['dir']);

        if (isset($columnMap[$orderColumnIdx])) {
            $field = $columnMap[$orderColumnIdx];
            $qb->orderBy($this->entityAlias . '.' . $field, $orderDir);
        }

        // ================== 8. Phân trang ==================
        $qb->setFirstResult($start)
            ->setMaxResults($length);

        $entities = $qb->getQuery()
            ->setHint(Query::HINT_READ_ONLY, true)->getResult();

        return [
            'draw'            => $draw,
            'recordsTotal'    => (int) $recordsTotal,
            'recordsFiltered' => (int) $recordsFiltered,
            'data'            => $this->formatData($entities),
        ];
    }
}