import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    message: '정말 삭제할까요?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('message가 표시된다', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('정말 삭제할까요?')).toBeInTheDocument();
  });

  it('subMessage가 표시된다', () => {
    render(<ConfirmModal {...defaultProps} subMessage="복구할 수 없습니다" />);
    expect(screen.getByText('복구할 수 없습니다')).toBeInTheDocument();
  });

  it('subMessage가 없으면 표시되지 않는다', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.queryByText('복구할 수 없습니다')).not.toBeInTheDocument();
  });

  it('기본 버튼 라벨은 "삭제"와 "취소"', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('커스텀 버튼 라벨이 적용된다', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="확인" cancelLabel="닫기" />);
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('확인 버튼 클릭 시 onConfirm이 호출된다', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('배경 클릭 시 onCancel이 호출된다', async () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    // 가장 바깥 div (backdrop) 클릭
    const backdrop = container.firstChild as HTMLElement;
    await userEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalled();
  });

  it('기본 아이콘이 표시된다', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('🗑️')).toBeInTheDocument();
  });

  it('커스텀 아이콘이 표시된다', () => {
    render(<ConfirmModal {...defaultProps} icon="⚠️" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
